import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema({
  billNo: {
    type: String,
    required: true,
    trim: true
  },
  vehicleNo: {
    type: String,
    required: true,
    trim: true
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  deliveryTime: {
    type: String,
    required: true,
    trim: true
  },
  tones: {
    type: Number,
    required: true,
    min: 0
  },
  pricePerTone: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  }
});

const invoiceSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  driverName: {
    type: String,
    required: true,
    trim: true
  },
  agentName: {
    type: String,
    required: true,
    trim: true
  },
  items: [invoiceItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  invoiceDate: {
    type: Date,
    default: Date.now
  },
  invoiceTime: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Add index for better query performance
invoiceSchema.index({ user: 1, invoiceDate: -1 });
invoiceSchema.index({ 'items.billNo': 1 });

export default mongoose.model("Invoice", invoiceSchema);