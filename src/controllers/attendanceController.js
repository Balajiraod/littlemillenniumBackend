const Attendance = require('../models/Attendance');
const Child = require('../models/Child');
const { AppError } = require('../middleware/errorHandler');

exports.markAttendance = async (req, res, next) => {
  const { classId, date, records } = req.body;
  const branchId = req.user.branch?._id || req.body.branch;

  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  const results = [];
  for (const record of records) {
    const existing = await Attendance.findOne({
      child: record.childId,
      date: attendanceDate,
    });

    if (existing) {
      const updated = await Attendance.findByIdAndUpdate(
        existing._id,
        { ...record, class: classId, branch: branchId },
        { new: true }
      );
      results.push(updated);
    } else {
      const created = await Attendance.create({
        child: record.childId,
        class: classId,
        branch: branchId,
        date: attendanceDate,
        status: record.status,
        remarks: record.remarks,
        checkIn: record.status === 'present' || record.status === 'late'
          ? { time: new Date(), method: 'manual', markedBy: req.user._id }
          : undefined,
      });
      results.push(created);
    }
  }

  if (req.app.get('io')) {
    req.app.get('io').to(`branch-${branchId}`).emit('attendance-updated', {
      classId,
      date: attendanceDate,
      count: results.length,
    });
  }

  res.json({ success: true, data: results, message: `${results.length} attendance records saved.` });
};

exports.getAttendance = async (req, res) => {
  const { classId, date, childId, month, year } = req.query;
  const filter = {};

  if (req.user.role !== 'super-admin') filter.branch = req.user.branch._id;

  if (classId) filter.class = classId;
  if (childId) filter.child = childId;

  if (date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    filter.date = { $gte: d, $lte: end };
  } else if (month && year) {
    filter.date = {
      $gte: new Date(year, month - 1, 1),
      $lte: new Date(year, month, 0),
    };
  }

  const records = await Attendance.find(filter)
    .populate('child', 'firstName lastName admissionNumber photo')
    .populate('class', 'name grade section')
    .sort({ date: -1 });

  res.json({ success: true, data: records });
};

exports.getChildAttendance = async (req, res, next) => {
  const { id } = req.params;
  const { month, year } = req.query;

  const filter = { child: id };
  if (month && year) {
    filter.date = {
      $gte: new Date(year, month - 1, 1),
      $lte: new Date(year, month, 0),
    };
  }

  const records = await Attendance.find(filter).sort({ date: 1 });

  const stats = {
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
    late: records.filter(r => r.status === 'late').length,
    halfDay: records.filter(r => r.status === 'half-day').length,
    total: records.length,
  };
  stats.percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

  res.json({ success: true, data: records, stats });
};

exports.getDailyReport = async (req, res) => {
  const { date } = req.params;
  const branchId = req.user.role !== 'super-admin' ? req.user.branch._id : req.query.branch;

  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);

  const records = await Attendance.find({ branch: branchId, date: { $gte: d, $lte: end } })
    .populate('child', 'firstName lastName grade section photo')
    .populate('class', 'name');

  const summary = records.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  res.json({
    success: true,
    data: records,
    summary: { ...summary, total: records.length },
    date: d.toISOString().split('T')[0],
  });
};
