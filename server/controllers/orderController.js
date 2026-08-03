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

/** GET /api/orders/open-by-table/:tableId — Find open order for table */
export async function getOpenOrderByTable(req, res, next) {
  try {
    const order = await Order.findOne({
      table: req.params.tableId,
      status: { $in: ['pending', 'preparing', 'served'] },
    }).populate('cashier', 'name username');

    if (!order) {
      return res.json({ success: true, data: null });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

/** POST /api/orders — Create a new order or send new round of items */
export async function createOrder(req, res, next) {
  try {
    const { orderType, tableId, items, discount = 0, paymentMethod = 'cash', isSendToKitchen = false } = req.body;

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

    // Check if there is already an existing open order for this table
    let existingOrder = null;
    if (orderType === 'dine-in' && tableId) {
      existingOrder = await Order.findOne({
        table: tableId,
        status: { $in: ['pending', 'preparing', 'served'] },
      });
    }

    // Determine target round number
    let currentRound = 1;
    if (existingOrder && Array.isArray(existingOrder.items) && existingOrder.items.length > 0) {
      const maxRound = Math.max(...existingOrder.items.map((i) => i.round || 1));
      currentRound = maxRound + 1;
    }

    // Snapshot new item details
    const newProcessedItems = [];
    let addedSubtotal = 0;

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
      addedSubtotal += lineSubtotal;

      newProcessedItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        variant: variantName || (item.variant ? String(item.variant) : ''),
        price: linePrice,
        quantity: qty,
        notes: item.notes ? String(item.notes).trim() : '',
        round: currentRound,
        sentAt: new Date(),
      });

      // REAL-WORLD INVENTORY DEDUCTION: deduct matching raw inventory stock if available
      try {
        const { Inventory } = await import('../models/Inventory.js');
        // Extract key words from menu item name e.g. "Zinger" from "Zinger Burger"
        const words = menuItem.name.split(/\s+/).filter(w => w.length > 2);
        let invItem = null;
        for (const word of words) {
          const safeWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          invItem = await Inventory.findOne({ name: { $regex: new RegExp(safeWord, 'i') } });
          if (invItem) break;
        }
        if (!invItem) {
          const safeFullName = menuItem.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          invItem = await Inventory.findOne({ name: { $regex: new RegExp(safeFullName, 'i') } });
        }
        if (invItem && invItem.quantity > 0) {
          invItem.quantity = Math.max(0, invItem.quantity - qty);
          await invItem.save();
        }
      } catch (invErr) {
        console.warn('Inventory deduction warning:', invErr.message);
      }
    }

    let finalOrder;

    if (existingOrder) {
      // Append new items to existing open order
      existingOrder.items.push(...newProcessedItems);
      
      // Recompute subtotal, tax, total
      let allSubtotal = existingOrder.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const discountAmount = Math.max(0, Number(discount) || existingOrder.discount || 0);
      const afterDiscount = Math.max(0, allSubtotal - discountAmount);
      const tax = Math.round(afterDiscount * (taxRatePercent / 100));
      const total = Math.round(afterDiscount + tax);

      existingOrder.subtotal = allSubtotal;
      existingOrder.discount = discountAmount;
      existingOrder.tax = tax;
      existingOrder.total = total;
      if (paymentMethod) existingOrder.paymentMethod = paymentMethod;

      // If completing (not just sending to kitchen), set status completed
      if (!isSendToKitchen) {
        existingOrder.status = 'completed';
        existingOrder.completedAt = new Date();
        if (table) {
          table.status = 'available';
          await table.save();
        }
      } else {
        existingOrder.status = 'pending'; // Reset status to pending so kitchen sees new items
      }

      await existingOrder.save();
      finalOrder = existingOrder;
    } else {
      // Create fresh new order
      const discountAmount = Math.max(0, Number(discount) || 0);
      const afterDiscount = Math.max(0, addedSubtotal - discountAmount);
      const tax = Math.round(afterDiscount * (taxRatePercent / 100));
      const total = Math.round(afterDiscount + tax);

      const orderNumber = await generateOrderNumber();
      const initialStatus = isSendToKitchen ? 'pending' : 'completed';

      finalOrder = await Order.create({
        orderNumber,
        orderType,
        table: orderType === 'dine-in' ? tableId : undefined,
        items: newProcessedItems,
        subtotal: addedSubtotal,
        discount: discountAmount,
        tax,
        total,
        paymentMethod,
        status: initialStatus,
        completedAt: initialStatus === 'completed' ? new Date() : undefined,
        cashier: req.user._id,
      });

      // Attach customer reference if provided
      if (req.body.customerId) {
        finalOrder.customer = req.body.customerId;
        await finalOrder.save();
      }

      // Update customer loyalty & spending stats if completed & customerId is present
      if (finalOrder.status === 'completed' && req.body.customerId) {
        try {
          const { Customer } = await import('../models/Customer.js');
          const cust = await Customer.findById(req.body.customerId);
          if (cust) {
            cust.totalSpent = (cust.totalSpent || 0) + finalOrder.total;
            cust.totalOrders = (cust.totalOrders || 0) + 1;
            cust.loyaltyPoints = (cust.loyaltyPoints || 0) + Math.floor(finalOrder.total / 100);
            await cust.save();
          }
        } catch (cErr) {
          console.warn('Customer metric update warning:', cErr.message);
        }
      }
    } // end else (new order)

    const populated = await finalOrder.populate([
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
