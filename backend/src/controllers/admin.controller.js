const { PrismaClient } = require('@prisma/client');
const { successResponse, paginatedResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, isActive } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, username: true, email: true, role: true,
          isActive: true, createdAt: true,
          _count: { select: { tasks: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return paginatedResponse(res, users, {
      page: parseInt(page), limit: parseInt(limit), total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch users.', 500);
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, username: true, email: true, role: true,
        isActive: true, createdAt: true, updatedAt: true,
        tasks: { orderBy: { createdAt: 'desc' }, take: 10 },
        _count: { select: { tasks: true } },
      },
    });

    if (!user) return errorResponse(res, 'User not found.', 404);

    return successResponse(res, user);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch user.', 500);
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['USER', 'ADMIN'].includes(role)) {
      return errorResponse(res, 'Role must be USER or ADMIN.', 422);
    }

    if (req.params.id === req.user.id) {
      return errorResponse(res, 'You cannot change your own role.', 400);
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, username: true, email: true, role: true },
    });

    logger.info(`Role updated for user ${user.id} to ${role} by admin ${req.user.id}`);
    return successResponse(res, user, 'User role updated');
  } catch (error) {
    return errorResponse(res, 'Failed to update role.', 500);
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return errorResponse(res, 'You cannot deactivate your own account.', 400);
    }

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) return errorResponse(res, 'User not found.', 404);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !existing.isActive },
      select: { id: true, username: true, email: true, isActive: true },
    });

    const action = user.isActive ? 'activated' : 'deactivated';
    logger.info(`User ${user.id} ${action} by admin ${req.user.id}`);
    return successResponse(res, user, `User account ${action}`);
  } catch (error) {
    return errorResponse(res, 'Failed to update user status.', 500);
  }
};

const getAllTasks = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority, userId } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (userId) where.userId = userId;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, username: true, email: true } } },
      }),
      prisma.task.count({ where }),
    ]);

    return paginatedResponse(res, tasks, {
      page: parseInt(page), limit: parseInt(limit), total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch tasks.', 500);
  }
};

const getPlatformStats = async (req, res) => {
  try {
    const [totalUsers, totalTasks, tasksByStatus, recentUsers] = await Promise.all([
      prisma.user.count(),
      prisma.task.count(),
      prisma.task.groupBy({ by: ['status'], _count: { status: true } }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' }, take: 5,
        select: { id: true, username: true, email: true, role: true, createdAt: true },
      }),
    ]);

    return successResponse(res, {
      totalUsers,
      totalTasks,
      tasksByStatus: Object.fromEntries(tasksByStatus.map((s) => [s.status, s._count.status])),
      recentUsers,
    });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch platform stats.', 500);
  }
};

module.exports = { getAllUsers, getUserById, updateUserRole, toggleUserStatus, getAllTasks, getPlatformStats };
