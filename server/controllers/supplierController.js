import { Supplier } from '../models/Supplier.js';

export async function getSuppliers(req, res, next) {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json({ success: true, data: suppliers });
  } catch (err) {
    next(err);
  }
}

export async function createSupplier(req, res, next) {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
}

export async function updateSupplier(req, res, next) {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
}

export async function deleteSupplier(req, res, next) {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, message: 'Supplier deleted' });
  } catch (err) {
    next(err);
  }
}

export async function recordSupplierPayment(req, res, next) {
  try {
    const { amount, paymentMethod = 'cash', note = '' } = req.body;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
    }

    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const newBalance = Math.max(0, (supplier.balance || 0) - numAmount);
    supplier.balance = newBalance;
    supplier.paymentHistory.push({
      amount: numAmount,
      paymentMethod,
      note,
      recordedBy: req.user?._id,
      createdAt: new Date(),
    });

    await supplier.save();
    res.json({ success: true, data: supplier, message: `Payment of ${numAmount} to supplier recorded successfully!` });
  } catch (err) {
    next(err);
  }
}
