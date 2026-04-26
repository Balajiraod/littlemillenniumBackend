const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  child: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly', 'annual', 'custom'],
    required: true,
  },
  period: {
    from: Date,
    to: Date,
    label: String,
    week: Number,
    month: Number,
    quarter: Number,
    year: Number,
  },
  attendance: {
    present: Number,
    absent: Number,
    late: Number,
    totalDays: Number,
    percentage: Number,
  },
  development: {
    cognitive: {
      score: { type: Number, min: 0, max: 10 },
      observations: String,
      strengths: [String],
      improvements: [String],
    },
    motor: {
      score: { type: Number, min: 0, max: 10 },
      observations: String,
      strengths: [String],
      improvements: [String],
    },
    emotional: {
      score: { type: Number, min: 0, max: 10 },
      observations: String,
      strengths: [String],
      improvements: [String],
    },
    language: {
      score: { type: Number, min: 0, max: 10 },
      observations: String,
      strengths: [String],
      improvements: [String],
    },
    social: {
      score: { type: Number, min: 0, max: 10 },
      observations: String,
      strengths: [String],
      improvements: [String],
    },
  },
  activities: {
    participated: Number,
    totalActivities: Number,
    highlights: [String],
    favoriteActivities: [String],
  },
  overallGrade: {
    type: String,
    enum: ['Excellent', 'Very Good', 'Good', 'Satisfactory', 'Needs Improvement'],
  },
  teacherComments: String,
  recommendations: [String],
  parentAcknowledged: { type: Boolean, default: false },
  parentAcknowledgedAt: Date,
  parentFeedback: String,
  status: {
    type: String,
    enum: ['draft', 'published', 'acknowledged'],
    default: 'draft',
  },
  publishedAt: Date,
  pdfUrl: String,
}, { timestamps: true });

reportSchema.index({ child: 1, type: 1, 'period.year': 1 });
reportSchema.index({ branch: 1, 'period.year': 1, 'period.month': 1 });

module.exports = mongoose.model('Report', reportSchema);
