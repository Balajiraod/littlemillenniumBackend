const Child = require('../models/Child');
const QRCode = require('qrcode');
const { AppError } = require('../middleware/errorHandler');

exports.getChildren = async (req, res) => {
  const { page = 1, limit = 20, grade, status, search, classId } = req.query;
  const filter = {};

  if (req.user.role !== 'super-admin') {
    filter.branch = req.user.branch._id;
  } else if (req.query.branch) {
    filter.branch = req.query.branch;
  }

  if (grade) filter.grade = grade;
  if (status) filter.status = status;
  if (classId) filter.class = classId;

  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { admissionNumber: { $regex: search, $options: 'i' } },
    ];
  }

  if (req.user.role === 'parent') {
    const Parent = require('../models/Parent');
    const parent = await Parent.findOne({ user: req.user._id });
    filter._id = { $in: parent?.children || [] };
  }

  const skip = (page - 1) * limit;
  const [children, total] = await Promise.all([
    Child.find(filter)
      .populate('class', 'name grade section')
      .populate('branch', 'name code')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit)),
    Child.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: children,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
};

exports.getChild = async (req, res, next) => {
  const child = await Child.findById(req.params.id)
    .populate('class', 'name grade section classTeacher')
    .populate('branch', 'name code address contact')
    .populate('parents.user', 'firstName lastName email phone avatar');

  if (!child) return next(new AppError('Child not found.', 404));

  res.json({ success: true, data: child });
};

exports.createChild = async (req, res, next) => {
  const branch = req.user.role === 'super-admin' ? req.body.branch : req.user.branch._id;

  const year = new Date().getFullYear();
  const count = await Child.countDocuments({ branch, academicYear: req.body.academicYear || `${year}-${year + 1}` });
  const admissionNumber = `${year}${String(count + 1).padStart(4, '0')}`;

  const child = await Child.create({
    ...req.body,
    branch,
    admissionNumber,
    academicYear: req.body.academicYear || `${year}-${year + 1}`,
  });

  const qrData = JSON.stringify({ childId: child._id, admissionNumber, name: `${child.firstName} ${child.lastName}` });
  const qrCode = await QRCode.toDataURL(qrData);
  child.qrCode = qrCode;
  await child.save();

  res.status(201).json({ success: true, data: child });
};

exports.updateChild = async (req, res, next) => {
  const child = await Child.findById(req.params.id);
  if (!child) return next(new AppError('Child not found.', 404));

  if (req.user.role !== 'super-admin' && child.branch.toString() !== req.user.branch._id.toString()) {
    return next(new AppError('Access denied.', 403));
  }

  const restrictedFields = ['admissionNumber', 'branch', 'qrCode'];
  restrictedFields.forEach(field => delete req.body[field]);

  const updated = await Child.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ success: true, data: updated });
};

exports.deleteChild = async (req, res, next) => {
  const child = await Child.findById(req.params.id);
  if (!child) return next(new AppError('Child not found.', 404));

  await Child.findByIdAndUpdate(req.params.id, { status: 'withdrawn' });
  res.json({ success: true, message: 'Child record deactivated.' });
};

exports.getChildQR = async (req, res, next) => {
  const child = await Child.findById(req.params.id).select('qrCode firstName lastName admissionNumber');
  if (!child) return next(new AppError('Child not found.', 404));
  res.json({ success: true, data: { qrCode: child.qrCode, child } });
};

exports.getDevelopmentProfile = async (req, res, next) => {
  const child = await Child.findById(req.params.id).select('developmentProfile firstName lastName grade');
  if (!child) return next(new AppError('Child not found.', 404));
  res.json({ success: true, data: child });
};

exports.updateDevelopmentProfile = async (req, res, next) => {
  const child = await Child.findByIdAndUpdate(
    req.params.id,
    { $set: { developmentProfile: { ...req.body, lastUpdated: new Date() } } },
    { new: true }
  );
  if (!child) return next(new AppError('Child not found.', 404));
  res.json({ success: true, data: child.developmentProfile });
};
