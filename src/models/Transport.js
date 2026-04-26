const mongoose = require('mongoose');

const transportSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  routeName: { type: String, required: true },
  routeCode: { type: String, required: true },
  vehicle: {
    number: { type: String, required: true },
    type: { type: String, enum: ['bus', 'van', 'auto'] },
    model: String,
    capacity: Number,
    insuranceExpiry: Date,
    fitnessExpiry: Date,
    permitExpiry: Date,
    gpsDeviceId: String,
  },
  driver: {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    phone: String,
    licenseNumber: String,
    licenseExpiry: Date,
    photo: String,
  },
  attendant: {
    name: String,
    phone: String,
    photo: String,
  },
  stops: [{
    order: Number,
    name: String,
    address: String,
    coordinates: { lat: Number, lng: Number },
    pickupTime: String,
    dropTime: String,
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Child' }],
  }],
  currentLocation: {
    lat: Number,
    lng: Number,
    speed: Number,
    timestamp: Date,
    heading: Number,
  },
  status: {
    type: String,
    enum: ['inactive', 'in-route', 'completed', 'breakdown', 'delayed'],
    default: 'inactive',
  },
  schedule: {
    morningPickup: String,
    eveningDrop: String,
    workingDays: [String],
  },
  safetyAlerts: [{
    type: { type: String, enum: ['speeding', 'breakdown', 'delay', 'panic', 'geofence'] },
    message: String,
    location: { lat: Number, lng: Number },
    triggeredAt: Date,
    resolvedAt: Date,
    isResolved: { type: Boolean, default: false },
  }],
  monthlyFee: Number,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

transportSchema.index({ branch: 1 });
transportSchema.index({ routeCode: 1, branch: 1 });

module.exports = mongoose.model('Transport', transportSchema);
