const { PrismaClient } = require('@prisma/client');
const { successResponse, createdResponse, paginatedResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

const PRIORITY_ORDER = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

const getTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      sortBy = 'createdAt',
      order = 'desc',
      search,
    } = req.query;

    const skip = (page - 1) * limit;

    const where = { userId: req.user.id };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: order },
      }),
      prisma.task.count({ where }),
    ]);

    return paginatedResponse(res, tasks, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error('Get tasks error:', error);
    return errorResponse(res, 'Failed to fetch tasks.', 500);
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!task) return errorResponse(res, 'Task not found.', 404);

    return successResponse(res, task);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch task.', 500);
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate || null,
        userId: req.user.id,
      },
    });

    logger.info(`Task created: ${task.id} by user ${req.user.id}`);
    return createdResponse(res, task, 'Task created successfully');
  } catch (error) {
    logger.error('Create task error:', error);
    return errorResponse(res, 'Failed to create task.', 500);
  }
};

const updateTask = async (req, res) => {
  try {
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!existing) return errorResponse(res, 'Task not found.', 404);

    const { title, description, status, priority, dueDate } = req.body;

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        title: title ?? existing.title,
        description: description ?? existing.description,
        status: status ?? existing.status,
        priority: priority ?? existing.priority,
        dueDate: dueDate !== undefined ? dueDate : existing.dueDate,
      },
    });

    return successResponse(res, updated, 'Task updated successfully');
  } catch (error) {
    logger.error('Update task error:', error);
    return errorResponse(res, 'Failed to update task.', 500);
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const VALID = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'];

    if (!VALID.includes(status)) {
      return errorResponse(res, `Status must be one of: ${VALID.join(', ')}`, 422);
    }

    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!existing) return errorResponse(res, 'Task not found.', 404);

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: { status },
    });

    return successResponse(res, updated, 'Task status updated');
  } catch (error) {
    return errorResponse(res, 'Failed to update status.', 500);
  }
};

const deleteTask = async (req, res) => {
  try {
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!existing) return errorResponse(res, 'Task not found.', 404);

    await prisma.task.delete({ where: { id: req.params.id } });

    logger.info(`Task deleted: ${req.params.id} by user ${req.user.id}`);
    return successResponse(res, null, 'Task deleted successfully');
  } catch (error) {
    logger.error('Delete task error:', error);
    return errorResponse(res, 'Failed to delete task.', 500);
  }
};

const getTaskStats = async (req, res) => {
  try {
    const [statusCounts, priorityCounts, recentTasks] = await Promise.all([
      prisma.task.groupBy({
        by: ['status'],
        where: { userId: req.user.id },
        _count: { status: true },
      }),
      prisma.task.groupBy({
        by: ['priority'],
        where: { userId: req.user.id },
        _count: { priority: true },
      }),
      prisma.task.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const stats = {
      byStatus: Object.fromEntries(statusCounts.map((s) => [s.status, s._count.status])),
      byPriority: Object.fromEntries(priorityCounts.map((p) => [p.priority, p._count.priority])),
      recentTasks,
      total: statusCounts.reduce((acc, s) => acc + s._count.status, 0),
    };

    return successResponse(res, stats, 'Stats fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch stats.', 500);
  }
};

module.exports = { getTasks, getTaskById, createTask, updateTask, updateTaskStatus, deleteTask, getTaskStats };
