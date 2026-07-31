import { Order } from '../models/Order.js';
import { MenuItem } from '../models/MenuItem.js';
import { Table } from '../models/Table.js';
import { Settings } from '../models/Settings.js';

/** Generate human-readable order number YYMMDD-XXX */
async function generateOrderNumber() {
  const now = new Date();
  const dateStr = now.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const countToday = await Order.countDocuments({
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  });

  const seq = String(countToday + 1).padStart(3, '0');
  return `${dateStr}-${seq}`;
}

/** POST /api/orders — Create a new order */
export async function createOrder(req, res, next) {
  try {
    const { orderType, tableId, items, discount = 0, paymentMethod = 'cash' } = req.body;

    if (!orderType || !['dine-in', 'takeaway', 'delivery'].includes(orderType)) {
      return res.status(400).json({ success: false, message: 'Valid order type is required' });
    }

    if (orderType === 'dine-in' && !tableId) {
      return res.status(400).json({ success: false, message: 'Table is required for dine-in orders' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
    }

    // Verify Table if dine-in
    let table = null;
    if (orderType === 'dine-in') {
      table = await Table.findById(tableId);
      if (!table) {
        return res.status(404).json({ success: false, message: 'Selected table not found' });
      }
    }

    // Fetch Settings for Tax Rate
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    const taxRatePercent = settings.taxRatePercent || 16;

    // Snapshot item details & compute subtotal
    const processedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem) {
        return res.status(400).json({ success: false, message: `Menu item not found: ${item.menuItem}` });
      }
      if (!menuItem.isAvailable) {
        return res.status(400).json({ success: false, message: `Item "${menuItem.name}" is currently unavailable` });
      }

      const qty = Math.max(1, Number(item.quantity) || 1);
      
      let linePrice = menuItem.price;
      let variantName = '';
      if (item.variant) {
        const matchedVariant = menuItem.variants?.find((v) => v.name === item.variant);
        if (matchedVariant) {
          linePrice = matchedVariant.price;
          variantName = matchedVariant.name;
        }
      } else if (item.price !== undefined && Number(item.price) >= 0) {
        linePrice = Number(item.price);
      }

      const lineSubtotal = linePrice * qty;
      subtotal += lineSubtotal;

      processedItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        variant: variantName || (item.variant ? String(item.variant) : ''),
        price: linePrice,
        quantity: qty,
        notes: item.notes ? String(item.notes).trim() : '',
      });
    }

    // Compute Totals
    const discountAmount = Math.max(0, Number(discount) || 0);
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const tax = Math.round(afterDiscount * (taxRatePercent / 100));
    const total = Math.round(afterDiscount + tax);

    const orderNumber = await generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      orderType,
      table: orderType === 'dine-in' ? tableId : undefined,
      items: processedItems,
      subtotal,
      discount: discountAmount,
      tax,
      total,
      paymentMethod,
      status: 'pending',
      cashier: req.user._id,
    });

    // Mark table occupied if dine-in
    if (orderType === 'dine-in' && table) {
      table.status = 'occupied';
      await table.save();
    }

    const populated = await order.populate([
      { path: 'table', select: 'name section' },
      { path: 'cashier', select: 'name username' },
    ]);

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
}

/** GET /api/orders — List orders (optional date, status, orderType filter) */
export async function getOrders(req, res, next) {
  try {
    const { status, orderType, date } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (orderType) filter.orderType = orderType;

    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
      filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    const orders = await Order.find(filter)
      .populate('table', 'name section')
      .populate('cashier', 'name username')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
}

/** GET /api/orders/:id — Get order by ID */
export async function getOrderById(req, res, next) {
  try {
    const order = await Order.findById(req.params.id)
      .populate('table', 'name section')
      .populate('cashier', 'name username');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/orders/:id/status — Update order status */
export async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'preparing', 'served', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    if (status === 'completed' || status === 'cancelled') {
      order.completedAt = new Date();

      // Free table if dine-in
      if (order.table) {
        await Table.findByIdAndUpdate(order.table, { status: 'available' });
      }
    }

    await order.save();

    const populated = await order.populate([
      { path: 'table', select: 'name section' },
      { path: 'cashier', select: 'name username' },
    ]);

    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
}
