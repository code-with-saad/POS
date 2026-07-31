import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    variants: [
      {
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const MenuItem = mongoose.model('MenuItem', menuItemSchema);
