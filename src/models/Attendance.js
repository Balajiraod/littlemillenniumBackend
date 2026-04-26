const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  child: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day', 'holiday', 'sick-leave'],
    required: true,
  },
  checkIn: {
    time: Date,
    method: { type: String, enum: ['manual', 'qr', 'biometric', 'parent-app'] },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  checkOut: {
    time: Date,
    method: { type: String, enum: ['manual', 'qr', 'biometric', 'parent-app'] },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pickedUpBy: String,
  },
  remarks: String,
  parentNotified: { type: Boolean, default: false },
  parentNotifiedAt: Date,
  lateReason: String,
  absentReason: String,
  medicalCertificate: String,
}, { timestamps: true });

attendanceSchema.index({ child: 1, date: -1 });
attendanceSchema.index({ branch: 1, date: -1 });
attendanceSchema.index({ class: 1, date: -1 });
attendanceSchema.index({ date: 1, branch: 1, status: 1 });

attendanceSchema.statics.getMonthlyStats = async function (branchId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  return this.aggregate([
    { $match: { branch: branchId, date: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);
};

module.exports = mongoose.model('Attendance', attendanceSchema);
