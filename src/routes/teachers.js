const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { AppError } = require('../middleware/errorHandler');

router.use(authenticate);

router.get('/', async (req, res) => {
  const { page = 1, limit = 20, search, isActive = true } = req.query;
  const filter = { isActive: isActive === 'true' };
  if (req.user.role !== 'super-admin') filter.branch = req.user.branch._id;
  if (req.query.branch) filter.branch = req.query.branch;

  const skip = (page - 1) * limit;
  const [teachers, total] = await Promise.all([
    Teacher.find(filter)
      .populate('user', 'firstName lastName email phone avatar lastLogin')
      .populate('branch', 'name code')
      .populate('classes', 'name grade section')
      .sort('-createdAt').skip(skip).limit(Number(limit)),
    Teacher.countDocuments(filter),
  ]);

  res.json({ success: true, data: teachers, pagination: { page: Number(page), limit: Number(limit), total } });
});

router.get('/:id', async (req, res, next) => {
  const teacher = await Teacher.findById(req.params.id)
    .populate('user', '-password')
    .populate('branch', 'name code')
    .populate('classes', 'name grade section');
  if (!teacher) return next(new AppError('Teacher not found.', 404));
  res.json({ success: true, data: teacher });
});

router.post('/', authorize('super-admin', 'branch-admin'), async (req, res, next) => {
  const { userId, classes, designation, qualifications, subjects } = req.body;
  const branch = req.user.role === 'super-admin' ? req.body.branch : req.user.branch._id;

  const existing = await Teacher.findOne({ user: userId });
  if (existing) return next(new AppError('Teacher profile already exists.', 400));

  const teacher = await Teacher.create({
    user: userId,
    branch,
    employeeId: `EMP-${Date.now()}`,
    designation,
    qualifications,
    subjects,
    classes,
  });

  await User.findByIdAndUpdate(userId, { role: 'teacher', branch });
  const populated = await teacher.populate('user', 'firstName lastName email');
  res.status(201).json({ success: true, data: populated });
});

router.put('/:id', authorize('super-admin', 'branch-admin'), async (req, res, next) => {
  const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate('user', 'firstName lastName email');
  if (!teacher) return next(new AppError('Teacher not found.', 404));
  res.json({ success: true, data: teacher });
});

module.exports = router;
