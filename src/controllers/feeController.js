const { Invoice, FeeStructure } = require('../models/Fee');
const Child = require('../models/Child');
const { AppError } = require('../middleware/errorHandler');

const generateInvoiceNumber = () => {
  const now = new Date();
  return `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-6)}`;
};

exports.getInvoices = async (req, res) => {
  const { page = 1, limit = 20, status, childId, month, year } = req.query;
  const filter = {};

  if (req.user.role !== 'super-admin') filter.branch = req.user.branch._id;
  if (req.user.role === 'parent') {
    const Parent = require('../models/Parent');
    const parent = await Parent.findOne({ user: req.user._id });
    filter.child = { $in: parent?.children || [] };
    filter.parent = req.user._id;
  }

  if (status) filter.status = status;
  if (childId) filter.child = childId;
  if (month && year) { filter.month = Number(month); filter.year = Number(year); }

  const skip = (page - 1) * limit;
  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .populate('child', 'firstName lastName admissionNumber grade')
      .populate('parent', 'firstName lastName email phone')
      .sort('-createdAt').skip(skip).limit(Number(limit)),
    Invoice.countDocuments(filter),
  ]);

  res.json({ success: true, data: invoices, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) } });
};

exports.createInvoice = async (req, res, next) => {
  const { childId, items, dueDate, month, year, discount } = req.body;

  const child = await Child.findById(childId).populate('parents.user');
  if (!child) return next(new AppError('Child not found.', 404));

  const primaryParent = child.parents.find(p => p.isPrimary) || child.parents[0];
  if (!primaryParent) return next(new AppError('No parent associated with this child.', 400));

  const subtotal = items.reduce((sum, item) => sum + (item.amount * (item.quantity || 1)), 0);
  let discountAmount = 0;
  if (discount) {
    discountAmount = discount.type === 'percentage' ? (subtotal * discount.value) / 100 : discount.value;
  }
  const total = subtotal - discountAmount;

  const invoice = await Invoice.create({
    invoiceNumber: generateInvoiceNumber(),
    child: childId,
    parent: primaryParent.user._id,
    branch: child.branch,
    academicYear: child.academicYear,
    month,
    year,
    dueDate: new Date(dueDate),
    items: items.map(item => ({ ...item, total: item.amount * (item.quantity || 1) })),
    subtotal,
    discount,
    total,
    balance: total,
    status: 'sent',
  });

  res.status(201).json({ success: true, data: invoice });
};

exports.recordPayment = async (req, res, next) => {
  const { id } = req.params;
  const { amount, method, transactionId, gateway, notes } = req.body;

  const invoice = await Invoice.findById(id);
  if (!invoice) return next(new AppError('Invoice not found.', 404));

  if (amount > invoice.balance) {
    return next(new AppError('Payment amount exceeds outstanding balance.', 400));
  }

  invoice.payments.push({ amount, method, transactionId, gateway, notes, paidAt: new Date(), verifiedBy: req.user._id });
  invoice.amountPaid += amount;
  invoice.balance = invoice.total - invoice.amountPaid;

  if (invoice.balance <= 0) invoice.status = 'paid';
  else if (invoice.amountPaid > 0) invoice.status = 'partial';

  await invoice.save();

  res.json({ success: true, data: invoice, message: 'Payment recorded successfully.' });
};

exports.getFeeStructure = async (req, res) => {
  const { grade, academicYear } = req.query;
  const filter = { isActive: true };
  if (req.user.role !== 'super-admin') filter.branch = req.user.branch._id;
  if (grade) filter.grade = grade;
  if (academicYear) filter.academicYear = academicYear;

  const structures = await FeeStructure.find(filter).populate('branch', 'name');
  res.json({ success: true, data: structures });
};

exports.createFeeStructure = async (req, res) => {
  const structure = await FeeStructure.create({
    ...req.body,
    branch: req.user.role === 'super-admin' ? req.body.branch : req.user.branch._id,
  });
  res.status(201).json({ success: true, data: structure });
};

exports.getFeeStats = async (req, res) => {
  const branchId = req.user.role !== 'super-admin' ? req.user.branch._id : req.query.branch;
  const { year, month } = req.query;

  const filter = { branch: branchId };
  if (year) filter.year = Number(year);
  if (month) filter.month = Number(month);

  const stats = await Invoice.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        total: { $sum: '$total' },
        collected: { $sum: '$amountPaid' },
        pending: { $sum: '$balance' },
      },
    },
  ]);

  const totals = await Invoice.aggregate([
    { $match: filter },
    { $group: { _id: null, totalDue: { $sum: '$total' }, totalCollected: { $sum: '$amountPaid' }, totalPending: { $sum: '$balance' } } },
  ]);

  res.json({ success: true, data: { byStatus: stats, totals: totals[0] || {} } });
};
