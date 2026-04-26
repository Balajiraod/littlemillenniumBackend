const express = require('express');
const router = express.Router();
const Branch = require('../models/Branch');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { AppError } = require('../middleware/errorHandler');

router.use(authenticate);

router.get('/', async (req, res) => {
  const filter = req.user.role === 'super-admin' ? {} : { _id: req.user.branch._id };
  const branches = await Branch.find(filter).populate('principal', 'firstName lastName email').sort('name');
  res.json({ success: true, data: branches });
});

router.get('/:id', async (req, res, next) => {
  const branch = await Branch.findById(req.params.id).populate('principal', 'firstName lastName email phone');
  if (!branch) return next(new AppError('Branch not found.', 404));
  res.json({ success: true, data: branch });
});

router.post('/', authorize('super-admin'), async (req, res) => {
  const branch = await Branch.create(req.body);
  res.status(201).json({ success: true, data: branch });
});

router.put('/:id', authorize('super-admin', 'branch-admin'), async (req, res, next) => {
  if (req.user.role === 'branch-admin' && req.user.branch._id.toString() !== req.params.id) {
    return next(new AppError('Access denied.', 403));
  }
  const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!branch) return next(new AppError('Branch not found.', 404));
  res.json({ success: true, data: branch });
});

module.exports = router;
