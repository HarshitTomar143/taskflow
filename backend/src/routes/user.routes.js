const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { PrismaClient } = require('@prisma/client');
const { successResponse, errorResponse } = require('../utils/response');

const prisma = new PrismaClient();

router.use(authenticate);

router.patch('/profile', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || username.trim().length < 3) {
      return errorResponse(res, 'Username must be at least 3 characters.', 422);
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { username: username.trim() },
      select: { id: true, username: true, email: true, role: true },
    });

    return successResponse(res, user, 'Profile updated');
  } catch (error) {
    if (error.code === 'P2002') return errorResponse(res, 'Username already taken.', 409);
    return errorResponse(res, 'Failed to update profile.', 500);
  }
});

module.exports = router;
