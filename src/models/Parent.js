const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Child' }],
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  occupation: String,
  workplace: String,
  annualIncome: Number,
  alternatePhone: String,
  emergencyContact: {
    name: String,
    phone: String,
    relation: String,
  },
  communicationPreferences: {
    whatsapp: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    app: { type: Boolean, default: true },
  },
  notifications: [{
    title: String,
    message: String,
    type: { type: String, enum: ['activity', 'fee', 'attendance', 'announcement', 'chat', 'report'] },
    isRead: { type: Boolean, default: false },
    data: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now },
  }],
  chatRooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' }],
  feedbackHistory: [{
    subject: String,
    message: String,
    response: String,
    status: { type: String, enum: ['pending', 'resolved', 'closed'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
  }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

parentSchema.index({ branch: 1 });

module.exports = mongoose.model('Parent', parentSchema);
