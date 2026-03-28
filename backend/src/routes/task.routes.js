const express = require('express');
const router = express.Router();
const {
  getTasks, getTaskById, createTask, updateTask,
  updateTaskStatus, deleteTask, getTaskStats,
} = require('../controllers/task.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createTaskValidator, updateTaskValidator, listTasksValidator } = require('../validators/task.validator');

router.use(authenticate);

router.get('/stats', getTaskStats);
router.get('/', listTasksValidator, validate, getTasks);
router.get('/:id', getTaskById);
router.post('/', createTaskValidator, validate, createTask);
router.put('/:id', updateTaskValidator, validate, updateTask);
router.patch('/:id/status', updateTaskStatus);
router.delete('/:id', deleteTask);

module.exports = router;
