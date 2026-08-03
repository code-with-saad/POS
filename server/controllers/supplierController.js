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
