import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true,
    },
    contactPerson: {
      type: String,
      default: '',
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
    categoryProvided: {
      type: String,
      default: '',
      trim: true,
    },
    balance: {
      type: Number,
      default: 0, // Amount owed to supplier
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export const Supplier = mongoose.model('Supplier', supplierSchema);
