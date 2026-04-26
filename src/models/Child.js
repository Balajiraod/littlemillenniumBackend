const mongoose = require('mongoose');

const GRADES = ['Pre-Nursery', 'Nursery', 'LKG', 'UKG'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

const childSchema = new mongoose.Schema({
  admissionNumber: { type: String, required: true, unique: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  photo: String,
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  grade: { type: String, enum: GRADES, required: true },
  section: { type: String, default: 'A' },
  academicYear: { type: String, required: true },
  rollNumber: String,
  admissionDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['active', 'inactive', 'graduated', 'withdrawn', 'suspended'],
    default: 'active',
  },
  parents: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    relation: { type: String, enum: ['Father', 'Mother', 'Guardian'], required: true },
    isPrimary: { type: Boolean, default: false },
    name: String,
    phone: String,
    email: String,
    occupation: String,
    photo: String,
  }],
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' },
  },
  medical: {
    bloodGroup: { type: String, enum: BLOOD_GROUPS, default: 'Unknown' },
    allergies: [String],
    conditions: [String],
    medications: [String],
    doctorName: String,
    doctorPhone: String,
    vaccinations: [{
      name: String,
      date: Date,
      nextDue: Date,
      certificate: String,
    }],
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
  },
  transport: {
    isEnrolled: { type: Boolean, default: false },
    route: { type: mongoose.Schema.Types.ObjectId, ref: 'Transport' },
    pickupPoint: String,
    dropPoint: String,
  },
  qrCode: String,
  biometricId: String,
  previousSchool: {
    name: String,
    class: String,
    passingYear: Number,
    tcNumber: String,
  },
  documents: [{
    type: { type: String, enum: ['birth-certificate', 'aadhaar', 'photo', 'tc', 'medical', 'other'] },
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now },
  }],
  developmentProfile: {
    cognitive: { type: Number, min: 0, max: 100, default: 0 },
    motor: { type: Number, min: 0, max: 100, default: 0 },
    emotional: { type: Number, min: 0, max: 100, default: 0 },
    language: { type: Number, min: 0, max: 100, default: 0 },
    social: { type: Number, min: 0, max: 100, default: 0 },
    lastUpdated: Date,
  },
  notes: String,
}, { timestamps: true });

childSchema.virtual('age').get(function () {
  const today = new Date();
  const dob = new Date(this.dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
});

childSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

childSchema.index({ branch: 1, grade: 1 });
childSchema.index({ 'parents.user': 1 });
childSchema.index({ status: 1, branch: 1 });

module.exports = mongoose.model('Child', childSchema);
