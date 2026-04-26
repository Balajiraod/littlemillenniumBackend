const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' },
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  contact: {
    phone: String,
    email: String,
    website: String,
  },
  principal: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  logo: String,
  banner: String,
  establishedYear: Number,
  affiliationNumber: String,
  capacity: { type: Number, default: 200 },
  currentEnrollment: { type: Number, default: 0 },
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  timings: {
    openTime: { type: String, default: '08:00' },
    closeTime: { type: String, default: '14:00' },
    workingDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    },
  },
  fees: {
    admissionFee: { type: Number, default: 0 },
    registrationFee: { type: Number, default: 0 },
  },
  amenities: [String],
  isActive: { type: Boolean, default: true },
  isHeadquarters: { type: Boolean, default: false },
  parentBranch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  franchiseDetails: {
    ownerName: String,
    ownerPhone: String,
    ownerEmail: String,
    agreementDate: Date,
    expiryDate: Date,
  },
}, { timestamps: true });

branchSchema.index({ isActive: 1 });

module.exports = mongoose.model('Branch', branchSchema);
