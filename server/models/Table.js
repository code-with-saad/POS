import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Table name is required'],
      unique: true,
      trim: true,
    },
    section: {
      type: String,
      default: '',
      trim: true,
    },
    capacity: {
      type: Number,
      default: 4,
      min: [1, 'Capacity must be at least 1'],
    },
    status: {
      type: String,
      enum: ['available', 'occupied'],
      default: 'available',
    },
  },
  {
    timestamps: true,
  }
);

export const Table = mongoose.model('Table', tableSchema);
