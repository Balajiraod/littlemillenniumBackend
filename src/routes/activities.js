const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { AppError } = require('../middleware/errorHandler');

router.use(authenticate);

router.get('/', async (req, res) => {
  const { childId, classId, date, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (req.user.role !== 'super-admin') filter.branch = req.user.branch._id;
  if (childId) filter.child = childId;
  if (classId) filter.class = classId;
  if (date) {
    const d = new Date(date);
    filter.date = { $gte: new Date(d.setHours(0, 0, 0, 0)), $lte: new Date(d.setHours(23, 59, 59, 999)) };
  }
  if (req.user.role === 'parent') {
    filter.isSharedWithParent = true;
    const Parent = require('../models/Parent');
    const parent = await Parent.findOne({ user: req.user._id });
    filter.child = { $in: parent?.children || [] };
  }

  const skip = (page - 1) * limit;
  const [activities, total] = await Promise.all([
    Activity.find(filter).populate('child', 'firstName lastName photo').populate('teacher', 'firstName lastName')
      .sort('-date').skip(skip).limit(Number(limit)),
    Activity.countDocuments(filter),
  ]);

  res.json({ success: true, data: activities, pagination: { page: Number(page), limit: Number(limit), total } });
});

router.post('/', authorize('super-admin', 'branch-admin', 'teacher'), async (req, res) => {
  const activity = await Activity.create({
    ...req.body,
    teacher: req.user._id,
    branch: req.user.role === 'super-admin' ? req.body.branch : req.user.branch._id,
  });
  res.status(201).json({ success: true, data: activity });
});

router.put('/:id', authorize('super-admin', 'branch-admin', 'teacher'), async (req, res, next) => {
  const activity = await Activity.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!activity) return next(new AppError('Activity not found.', 404));
  res.json({ success: true, data: activity });
});

module.exports = router;
