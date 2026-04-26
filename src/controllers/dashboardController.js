const Child = require('../models/Child');
const Teacher = require('../models/Teacher');
const Attendance = require('../models/Attendance');
const { Invoice } = require('../models/Fee');
const Activity = require('../models/Activity');
const Report = require('../models/Report');
const Branch = require('../models/Branch');

exports.getAdminStats = async (req, res) => {
  const branchId = req.user.role !== 'super-admin' ? req.user.branch._id : req.query.branch;
  const filter = branchId ? { branch: branchId } : {};

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const [
    totalChildren,
    activeChildren,
    totalTeachers,
    todayAttendance,
    monthlyRevenue,
    pendingFees,
    todayActivities,
    recentEnrollments,
  ] = await Promise.all([
    Child.countDocuments(filter),
    Child.countDocuments({ ...filter, status: 'active' }),
    Teacher.countDocuments({ ...filter, isActive: true }),
    Attendance.countDocuments({ ...filter, date: { $gte: today, $lte: todayEnd }, status: 'present' }),
    Invoice.aggregate([
      { $match: { ...filter, status: 'paid', createdAt: { $gte: new Date(today.getFullYear(), today.getMonth(), 1) } } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } },
    ]),
    Invoice.aggregate([
      { $match: { ...filter, status: { $in: ['sent', 'partial', 'overdue'] } } },
      { $group: { _id: null, total: { $sum: '$balance' } } },
    ]),
    Activity.countDocuments({ ...filter, date: { $gte: today, $lte: todayEnd } }),
    Child.find({ ...filter, status: 'active' }).sort('-admissionDate').limit(5)
      .populate('class', 'name grade').select('firstName lastName grade photo admissionDate'),
  ]);

  res.json({
    success: true,
    data: {
      totalChildren,
      activeChildren,
      totalTeachers,
      todayPresent: todayAttendance,
      attendanceRate: activeChildren > 0 ? Math.round((todayAttendance / activeChildren) * 100) : 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      pendingFees: pendingFees[0]?.total || 0,
      todayActivities,
      recentEnrollments,
    },
  });
};

exports.getAttendanceTrend = async (req, res) => {
  const branchId = req.user.role !== 'super-admin' ? req.user.branch._id : req.query.branch;
  const days = parseInt(req.query.days) || 30;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const trend = await Attendance.aggregate([
    {
      $match: {
        branch: branchId,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          status: '$status',
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.date': 1 } },
  ]);

  res.json({ success: true, data: trend });
};

exports.getEnrollmentByGrade = async (req, res) => {
  const branchId = req.user.role !== 'super-admin' ? req.user.branch._id : req.query.branch;
  const filter = { status: 'active' };
  if (branchId) filter.branch = branchId;

  const data = await Child.aggregate([
    { $match: filter },
    { $group: { _id: '$grade', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  res.json({ success: true, data });
};

exports.getRevenueTrend = async (req, res) => {
  const branchId = req.user.role !== 'super-admin' ? req.user.branch._id : req.query.branch;
  const months = parseInt(req.query.months) || 6;

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const trend = await Invoice.aggregate([
    {
      $match: {
        branch: branchId,
        status: { $in: ['paid', 'partial'] },
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: { year: '$year', month: '$month' },
        collected: { $sum: '$amountPaid' },
        invoiced: { $sum: '$total' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  res.json({ success: true, data: trend });
};

exports.getBranchStats = async (req, res) => {
  const stats = await Branch.aggregate([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: 'children',
        localField: '_id',
        foreignField: 'branch',
        as: 'children',
      },
    },
    {
      $lookup: {
        from: 'teachers',
        localField: '_id',
        foreignField: 'branch',
        as: 'teachers',
      },
    },
    {
      $project: {
        name: 1,
        code: 1,
        'address.city': 1,
        totalChildren: { $size: '$children' },
        totalTeachers: { $size: '$teachers' },
        capacity: 1,
        occupancyRate: {
          $multiply: [{ $divide: [{ $size: '$children' }, '$capacity'] }, 100],
        },
      },
    },
  ]);

  res.json({ success: true, data: stats });
};

exports.getParentDashboard = async (req, res) => {
  const Parent = require('../models/Parent');
  const parent = await Parent.findOne({ user: req.user._id }).populate('children');

  if (!parent) {
    return res.json({ success: true, data: { children: [], notifications: [] } });
  }

  const childrenData = await Promise.all(
    parent.children.map(async (childId) => {
      const child = await Child.findById(childId)
        .populate('class', 'name grade section classTeacher')
        .select('firstName lastName grade photo status admissionNumber developmentProfile');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      const todayAttendance = await Attendance.findOne({
        child: childId,
        date: { $gte: today, $lte: todayEnd },
      });

      const recentActivities = await Activity.find({ child: childId, isSharedWithParent: true })
        .sort('-date').limit(3).select('title type mood date media');

      const pendingFees = await Invoice.find({
        child: childId,
        status: { $in: ['sent', 'partial', 'overdue'] },
      }).select('invoiceNumber total balance dueDate status');

      return { child, todayAttendance, recentActivities, pendingFees };
    })
  );

  const unreadNotifications = parent.notifications.filter(n => !n.isRead).length;

  res.json({
    success: true,
    data: { children: childrenData, unreadNotifications, notifications: parent.notifications.slice(0, 10) },
  });
};
