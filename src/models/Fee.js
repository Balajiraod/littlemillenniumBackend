const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  grade: { type: String, enum: ['Pre-Nursery', 'Nursery', 'LKG', 'UKG'], required: true },
  academicYear: { type: String, required: true },
  components: [{
    name: String,
    amount: Number,
    frequency: { type: String, enum: ['monthly', 'quarterly', 'annual', 'one-time'] },
    isOptional: { type: Boolean, default: false },
    dueDay: { type: Number, default: 5 },
  }],
  totalAnnual: Number,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  child: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  academicYear: { type: String, required: true },
  month: Number,
  year: Number,
  dueDate: Date,
  items: [{
    description: String,
    amount: Number,
    quantity: { type: Number, default: 1 },
    total: Number,
  }],
  subtotal: Number,
  discount: {
    type: { type: String, enum: ['percentage', 'fixed'] },
    value: Number,
    reason: String,
  },
  lateFee: { type: Number, default: 0 },
  total: Number,
  amountPaid: { type: Number, default: 0 },
  balance: Number,
  status: {
    type: String,
    enum: ['draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled', 'refunded'],
    default: 'draft',
  },
  payments: [{
    amount: Number,
    method: { type: String, enum: ['cash', 'cheque', 'online', 'card', 'upi', 'neft'] },
    transactionId: String,
    gateway: { type: String, enum: ['razorpay', 'stripe', 'manual'] },
    gatewayOrderId: String,
    gatewayPaymentId: String,
    receipt: String,
    paidBy: String,
    notes: String,
    paidAt: { type: Date, default: Date.now },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
  notes: String,
  reminders: [{
    sentAt: Date,
    channel: String,
    status: String,
  }],
}, { timestamps: true });

invoiceSchema.index({ child: 1, academicYear: 1 });
invoiceSchema.index({ branch: 1, status: 1 });
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ dueDate: 1, status: 1 });

module.exports = {
  FeeStructure: mongoose.model('FeeStructure', feeStructureSchema),
  Invoice: mongoose.model('Invoice', invoiceSchema),
};
