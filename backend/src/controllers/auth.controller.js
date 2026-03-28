const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../utils/jwt');
const { successResponse, createdResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      return errorResponse(res, `An account with this ${field} already exists.`, 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword },
      select: { id: true, username: true, email: true, role: true, createdAt: true },
    });

    const token = generateToken({ userId: user.id, role: user.role });

    logger.info(`New user registered: ${user.email}`);

    return createdResponse(res, { user, token }, 'Account created successfully');
  } catch (error) {
    logger.error('Register error:', error);
    return errorResponse(res, 'Failed to create account. Please try again.', 500);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    const dummyHash = '$2a$12$dummyhashfortimingprotection1234567890ABCDEF';
    const passwordMatch = user
      ? await bcrypt.compare(password, user.password)
      : await bcrypt.compare(password, dummyHash);

    if (!user || !passwordMatch) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Account has been deactivated. Contact support.', 403);
    }

    const token = generateToken({ userId: user.id, role: user.role });

    logger.info(`User logged in: ${user.email}`);

    return successResponse(
      res,
      {
        user: { id: user.id, username: user.username, email: user.email, role: user.role },
        token,
      },
      'Login successful'
    );
  } catch (error) {
    logger.error('Login error:', error);
    return errorResponse(res, 'Login failed. Please try again.', 500);
  }
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, username: true, email: true, role: true,
        isActive: true, createdAt: true, updatedAt: true,
        _count: { select: { tasks: true } },
      },
    });

    return successResponse(res, user, 'Profile fetched');
  } catch (error) {
    return errorResponse(res, 'Could not fetch profile.', 500);
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.password);

    if (!valid) {
      return errorResponse(res, 'Current password is incorrect.', 400);
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

    return successResponse(res, null, 'Password changed successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to change password.', 500);
  }
};

module.exports = { register, login, getMe, changePassword };
