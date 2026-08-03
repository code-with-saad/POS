import { Purchase } from '../models/Purchase.js';
import { Supplier } from '../models/Supplier.js';
import { Inventory } from '../models/Inventory.js';
import { Order } from '../models/Order.js';

export async function getPurchases(req, res, next) {
  try {
    const purchases = await Purchase.find().populate('supplier', 'name contactPerson').sort({ createdAt: -1 });
    res.json({ success: true, data: purchases });
  } catch (err) {
    next(err);
  }
}

export async function createPurchase(req, res, next) {
  try {
    const { supplierId, items, paidAmount = 0, notes } = req.body;
    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Supplier and at least one item are required' });
    }

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });

    let totalAmount = 0;
    const formattedItems = items.map((item) => {
      const qty = Number(item.quantity) || 0;
      const cost = Number(item.unitCost) || 0;
      const lineTotal = qty * cost;
      totalAmount += lineTotal;
      return {
        itemName: item.itemName,
        quantity: qty,
        unit: item.unit || 'pcs',
        unitCost: cost,
        totalCost: lineTotal,
      };
    });

    const paid = Number(paidAmount) || 0;
    let paymentStatus = 'unpaid';
    if (paid >= totalAmount) paymentStatus = 'paid';
    else if (paid > 0) paymentStatus = 'partial';

    const count = await Purchase.countDocuments();
    const purchaseNumber = `PO-${String(count + 1).padStart(5, '0')}`;

    const purchase = await Purchase.create({
      purchaseNumber,
      supplier: supplierId,
      items: formattedItems,
      totalAmount,
      paidAmount: paid,
      paymentStatus,
      notes,
    });

    // Update supplier balance (unpaid amount added to balance)
    const unpaid = totalAmount - paid;
    if (unpaid > 0) {
      supplier.balance = (supplier.balance || 0) + unpaid;
      await supplier.save();
    }

    // Auto-update inventory quantities if matching item exists
    for (const pItem of formattedItems) {
      const invItem = await Inventory.findOne({ name: { $regex: new RegExp(`^${pItem.itemName}$`, 'i') } });
      if (invItem) {
        invItem.quantity += pItem.quantity;
        invItem.costPrice = pItem.unitCost;
        await invItem.save();
      }
    }

    res.status(201).json({ success: true, data: purchase });
  } catch (err) {
    next(err);
  }
}

/** RESET / START NEW BOOK: Clear all sales, orders, and purchases for a fresh accounting start */
export async function resetBook(req, res, next) {
  try {
    const { confirmText } = req.body;
    if (confirmText !== 'RESET') {
      return res.status(400).json({ success: false, message: 'Please type RESET to confirm' });
    }

    await Promise.all([
      Order.deleteMany({}),
      Purchase.deleteMany({}),
      Supplier.updateMany({}, { balance: 0 }),
    ]);

    res.json({ success: true, message: 'New accounting book started! All past sales, orders, and purchases have been reset.' });
  } catch (err) {
    next(err);
  }
}
