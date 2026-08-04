import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      default: '',
      lowercase: true,
      trim: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    receivableBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentHistory: [
      {
        amount: { type: Number, required: true, min: 0 },
        paymentMethod: { type: String, enum: ['cash', 'card'], default: 'cash' },
        note: { type: String, default: '' },
        recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export const Customer = mongoose.model('Customer', customerSchema);
