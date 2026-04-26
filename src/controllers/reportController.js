const Report = require('../models/Report');
const Child = require('../models/Child');
const Attendance = require('../models/Attendance');
const Activity = require('../models/Activity');
const { AppError } = require('../middleware/errorHandler');

exports.generateWeeklyReport = async (req, res, next) => {
  const { childId, weekStart, weekEnd } = req.body;

  const child = await Child.findById(childId);
  if (!child) return next(new AppError('Child not found.', 404));

  const start = new Date(weekStart);
  const end = new Date(weekEnd);
  end.setHours(23, 59, 59, 999);

  const [attendanceRecords, activities] = await Promise.all([
    Attendance.find({ child: childId, date: { $gte: start, $lte: end } }),
    Activity.find({ child: childId, date: { $gte: start, $lte: end } }),
  ]);

  const attendanceStats = {
    present: attendanceRecords.filter(r => r.status === 'present').length,
    absent: attendanceRecords.filter(r => r.status === 'absent').length,
    late: attendanceRecords.filter(r => r.status === 'late').length,
    totalDays: attendanceRecords.length,
  };
  attendanceStats.percentage = attendanceStats.totalDays > 0
    ? Math.round((attendanceStats.present / attendanceStats.totalDays) * 100) : 0;

  const developmentData = aggregateDevelopmentFromActivities(activities);

  const report = await Report.create({
    child: childId,
    class: child.class,
    branch: child.branch,
    teacher: req.user._id,
    type: 'weekly',
    period: {
      from: start,
      to: end,
      label: `Week of ${start.toLocaleDateString()}`,
      week: Math.ceil(start.getDate() / 7),
      month: start.getMonth() + 1,
      year: start.getFullYear(),
    },
    attendance: attendanceStats,
    development: developmentData,
    activities: {
      participated: activities.length,
      totalActivities: activities.length,
      highlights: activities.slice(0, 3).map(a => a.title),
      favoriteActivities: getMostFrequentActivities(activities),
    },
    status: 'draft',
  });

  res.status(201).json({ success: true, data: report });
};

exports.getReports = async (req, res) => {
  const { childId, type, year, month, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (req.user.role !== 'super-admin') filter.branch = req.user.branch._id;
  if (childId) filter.child = childId;
  if (type) filter.type = type;
  if (year) filter['period.year'] = Number(year);
  if (month) filter['period.month'] = Number(month);

  if (req.user.role === 'parent') {
    const Parent = require('../models/Parent');
    const parent = await Parent.findOne({ user: req.user._id });
    filter.child = { $in: parent?.children || [] };
    filter.status = 'published';
  }

  const skip = (page - 1) * limit;
  const [reports, total] = await Promise.all([
    Report.find(filter)
      .populate('child', 'firstName lastName grade photo')
      .populate('teacher', 'firstName lastName')
      .sort('-createdAt').skip(skip).limit(Number(limit)),
    Report.countDocuments(filter),
  ]);

  res.json({ success: true, data: reports, pagination: { page: Number(page), limit: Number(limit), total } });
};

exports.getReport = async (req, res, next) => {
  const report = await Report.findById(req.params.id)
    .populate('child', 'firstName lastName grade photo admissionNumber dateOfBirth')
    .populate('class', 'name grade section')
    .populate('teacher', 'firstName lastName')
    .populate('branch', 'name logo');

  if (!report) return next(new AppError('Report not found.', 404));
  res.json({ success: true, data: report });
};

exports.updateReport = async (req, res, next) => {
  const report = await Report.findById(req.params.id);
  if (!report) return next(new AppError('Report not found.', 404));

  const updated = await Report.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ success: true, data: updated });
};

exports.publishReport = async (req, res, next) => {
  const report = await Report.findByIdAndUpdate(
    req.params.id,
    { status: 'published', publishedAt: new Date() },
    { new: true }
  );
  if (!report) return next(new AppError('Report not found.', 404));
  res.json({ success: true, data: report, message: 'Report published successfully.' });
};

exports.acknowledgeReport = async (req, res, next) => {
  const report = await Report.findByIdAndUpdate(
    req.params.id,
    { parentAcknowledged: true, parentAcknowledgedAt: new Date(), status: 'acknowledged', parentFeedback: req.body.feedback },
    { new: true }
  );
  if (!report) return next(new AppError('Report not found.', 404));
  res.json({ success: true, data: report });
};

function aggregateDevelopmentFromActivities(activities) {
  const areas = ['cognitive', 'motor', 'emotional', 'language', 'social'];
  const result = {};
  areas.forEach(area => {
    const relevant = activities.flatMap(a => a.skillsDeveloped?.filter(s => s.area === area) || []);
    const score = relevant.length > 0
      ? Math.min(10, Math.round((relevant.filter(s => s.level === 'achieved').length * 3 + relevant.filter(s => s.level === 'developing').length * 2 + relevant.filter(s => s.level === 'emerging').length) / relevant.length * 2))
      : 5;
    result[area] = { score, observations: `Based on ${relevant.length} recorded activities`, strengths: [], improvements: [] };
  });
  return result;
}

function getMostFrequentActivities(activities) {
  const freq = activities.reduce((acc, a) => { acc[a.type] = (acc[a.type] || 0) + 1; return acc; }, {});
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([type]) => type);
}
