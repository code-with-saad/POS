import { Inventory } from '../models/Inventory.js';

/** GET /api/inventory — List all inventory items */
export async function getInventory(req, res, next) {
  try {
    const items = await Inventory.find().populate('supplier', 'name contactPerson').sort({ name: 1 });
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

/** POST /api/inventory — Create inventory item */
export async function createInventory(req, res, next) {
  try {
    const item = await Inventory.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/inventory/:id — Update inventory item */
export async function updateInventory(req, res, next) {
  try {
    const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/inventory/:id/stock — Adjust stock quantity (+ or -) */
export async function adjustStock(req, res, next) {
  try {
    const { adjustment, reason } = req.body; // adjustment can be positive or negative
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    item.quantity = Math.max(0, item.quantity + Number(adjustment || 0));
    if (reason) item.notes = `${item.notes ? item.notes + ' | ' : ''}Stock adjust (${adjustment > 0 ? '+' : ''}${adjustment}): ${reason}`;
    await item.save();

    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/inventory/:id — Delete item */
export async function deleteInventory(req, res, next) {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    next(err);
  }
}
