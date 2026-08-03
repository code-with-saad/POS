import mongoose from 'mongoose';

const purchaseItemSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0.01 },
    unit: { type: String, default: 'pcs' },
    unitCost: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const purchaseSchema = new mongoose.Schema(
  {
    purchaseNumber: {
      type: String,
      required: true,
      unique: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier is required'],
    },
    items: [purchaseItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'partial', 'unpaid'],
      default: 'unpaid',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export const Purchase = mongoose.model('Purchase', purchaseSchema);
