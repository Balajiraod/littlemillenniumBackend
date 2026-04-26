const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  child: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  type: {
    type: String,
    enum: ['learning', 'play', 'art', 'music', 'physical', 'story', 'outdoor', 'meal', 'nap', 'observation', 'other'],
    required: true,
  },
  title: { type: String, required: true },
  description: String,
  mood: {
    type: String,
    enum: ['happy', 'excited', 'calm', 'tired', 'sad', 'cranky', 'neutral'],
  },
  meal: {
    breakfast: { ate: String, notes: String },
    lunch: { ate: String, notes: String },
    snack: { ate: String, notes: String },
  },
  nap: {
    slept: Boolean,
    duration: Number,
    from: String,
    to: String,
  },
  toilet: {
    count: Number,
    notes: String,
  },
  learningOutcomes: [String],
  skillsDeveloped: [{
    area: { type: String, enum: ['cognitive', 'motor', 'emotional', 'language', 'social'] },
    level: { type: String, enum: ['emerging', 'developing', 'achieved'] },
    note: String,
  }],
  media: [{
    url: String,
    type: { type: String, enum: ['photo', 'video'] },
    thumbnail: String,
    caption: String,
  }],
  parentViewed: { type: Boolean, default: false },
  parentViewedAt: Date,
  parentComment: String,
  teacherNotes: String,
  isSharedWithParent: { type: Boolean, default: true },
}, { timestamps: true });

activitySchema.index({ child: 1, date: -1 });
activitySchema.index({ branch: 1, date: -1 });
activitySchema.index({ class: 1, date: -1 });

module.exports = mongoose.model('Activity', activitySchema);
