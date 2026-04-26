const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h',
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });
  return { accessToken, refreshToken };
};

const sendTokenResponse = (user, statusCode, res) => {
  const { accessToken, refreshToken } = generateTokens(user._id);
  res.status(statusCode).json({
    success: true,
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatar: user.avatar,
      branch: user.branch,
      preferences: user.preferences,
    },
  });
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password.', 400));
  }

  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+password +loginAttempts +lockUntil')
    .populate('branch', 'name code isActive');

  if (!user) {
    return next(new AppError('Invalid credentials.', 401));
  }

  if (user.isLocked) {
    return next(new AppError('Account locked due to multiple failed attempts. Try again in 2 hours.', 423));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incLoginAttempts();
    return next(new AppError('Invalid credentials.', 401));
  }

  await User.findByIdAndUpdate(user._id, {
    $set: { loginAttempts: 0, lastLogin: new Date() },
    $unset: { lockUntil: 1 },
  });

  logger.info(`User logged in: ${user.email} (${user.role})`);
  sendTokenResponse(user, 200, res);
};

exports.register = async (req, res, next) => {
  const { firstName, lastName, email, password, role, branch, phone } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return next(new AppError('Email already registered.', 400));
  }

  if (role === 'super-admin' && req.user?.role !== 'super-admin') {
    return next(new AppError('Cannot create super-admin account.', 403));
  }

  const user = await User.create({ firstName, lastName, email, password, role, branch, phone });

  if (role === 'teacher' && branch) {
    await Teacher.create({
      user: user._id,
      branch,
      employeeId: `EMP-${Date.now()}`,
    });
  }

  if (role === 'parent' && branch) {
    await Parent.create({ user: user._id, branch });
  }

  sendTokenResponse(user, 201, res);
};

exports.refreshToken = async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return next(new AppError('Refresh token required.', 400));
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).populate('branch', 'name code isActive');
    if (!user || !user.isActive) {
      return next(new AppError('Invalid refresh token.', 401));
    }
    sendTokenResponse(user, 200, res);
  } catch {
    return next(new AppError('Invalid or expired refresh token.', 401));
  }
};

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id).populate('branch', 'name code logo address');
  res.json({ success: true, data: user });
};

exports.updateProfile = async (req, res) => {
  const allowedFields = ['firstName', 'lastName', 'phone', 'avatar', 'preferences'];
  const updates = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, data: user });
};

exports.changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return next(new AppError('Current password is incorrect.', 400));
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
};

exports.logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
};
