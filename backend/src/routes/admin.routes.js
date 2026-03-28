const express = require('express');
const router = express.Router();
const {
  getAllUsers, getUserById, updateUserRole,
  toggleUserStatus, getAllTasks, getPlatformStats,
} = require('../controllers/admin.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

router.use(authenticate, requireAdmin);

router.get('/stats', getPlatformStats);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', toggleUserStatus);
router.get('/tasks', getAllTasks);

module.exports = router;
