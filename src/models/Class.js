const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  grade: {
    type: String,
    enum: ['Pre-Nursery', 'Nursery', 'LKG', 'UKG'],
    required: true,
  },
  section: { type: String, default: 'A' },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  assistantTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  capacity: { type: Number, default: 20 },
  currentStrength: { type: Number, default: 0 },
  academicYear: { type: String, required: true },
  room: String,
  curriculum: {
    theme: String,
    description: String,
    subjects: [{
      name: String,
      weeklyHours: Number,
      activities: [String],
    }],
    monthlyPlans: [{
      month: Number,
      year: Number,
      theme: String,
      topics: [String],
      activities: [String],
      milestones: [String],
    }],
  },
  timetable: [{
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
    slots: [{
      startTime: String,
      endTime: String,
      subject: String,
      teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
      activity: String,
    }],
  }],
  fees: {
    tuitionFee: Number,
    activityFee: Number,
    transportFee: Number,
    mealFee: Number,
    annualCharges: Number,
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

classSchema.index({ branch: 1, grade: 1, section: 1 });
classSchema.index({ academicYear: 1, branch: 1 });

module.exports = mongoose.model('Class', classSchema);
