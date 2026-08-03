import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    sku: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    unit: {
      type: String,
      enum: ['kg', 'g', 'l', 'ml', 'pcs', 'pack', 'box'],
      default: 'pcs',
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    minStockAlert: {
      type: Number,
      default: 5,
      min: 0,
    },
    costPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export const Inventory = mongoose.model('Inventory', inventorySchema);
