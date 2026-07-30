import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    restaurantName: {
      type: String,
      required: true,
      default: 'CafePOS',
    },
    address: {
      type: String,
      default: 'Main Boulevard, Gulberg III, Lahore',
    },
    phone: {
      type: String,
      default: '+92 42 111 222 333',
    },
    taxRatePercent: {
      type: Number,
      default: 16,
      min: 0,
      max: 100,
    },
    receiptFooter: {
      type: String,
      default: 'Thank you for visiting CafePOS!',
    },
  },
  {
    timestamps: true,
  }
);

export const Settings = mongoose.model('Settings', settingsSchema);
