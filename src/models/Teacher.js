const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  employeeId: { type: String, required: true, unique: true },
  designation: {
    type: String,
    enum: ['Head Teacher', 'Senior Teacher', 'Teacher', 'Assistant Teacher', 'Activity Teacher'],
    default: 'Teacher',
  },
  qualifications: [{
    degree: String,
    institution: String,
    year: Number,
    specialization: String,
  }],
  experience: {
    years: { type: Number, default: 0 },
    previousSchools: [{
      name: String,
      designation: String,
      from: Date,
      to: Date,
    }],
  },
  subjects: [String],
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  joinDate: { type: Date, default: Date.now },
  salary: {
    basic: Number,
    allowances: Number,
    deductions: Number,
  },
  bankDetails: {
    accountNumber: { type: String, select: false },
    ifscCode: { type: String, select: false },
    bankName: String,
  },
  documents: [{
    type: { type: String },
    name: String,
    url: String,
  }],
  availability: {
    days: [String],
    startTime: String,
    endTime: String,
  },
  performanceRatings: [{
    period: String,
    rating: { type: Number, min: 1, max: 5 },
    remarks: String,
    ratedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ratedAt: Date,
  }],
  isClassTeacher: { type: Boolean, default: false },
  specializations: [String],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

teacherSchema.index({ branch: 1 });

module.exports = mongoose.model('Teacher', teacherSchema);
