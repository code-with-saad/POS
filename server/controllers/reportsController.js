import { Order } from '../models/Order.js';

/** Helper: build date range from query params (from / to) */
function getDateRange(query) {
  const now = new Date();
  const from = query.from ? new Date(query.from) : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = query.to ? new Date(query.to) : now;
  // ensure 'to' covers end of day
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

/** GET /api/reports/summary — overall totals for a date range */
export async function getSummaryReport(req, res, next) {
  try {
    const { from, to } = getDateRange(req.query);

    const [completed, cancelled, allOrders] = await Promise.all([
      Order.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$total' },
            count: { $sum: 1 },
            avgValue: { $avg: '$total' },
            totalDiscount: { $sum: '$discount' },
            totalTax: { $sum: '$tax' },
          },
        },
      ]),
      Order.countDocuments({ status: 'cancelled', createdAt: { $gte: from, $lte: to } }),
      Order.countDocuments({ createdAt: { $gte: from, $lte: to } }),
    ]);

    const c = completed[0] || { revenue: 0, count: 0, avgValue: 0, totalDiscount: 0, totalTax: 0 };

    res.json({
      success: true,
      data: {
        from,
        to,
        totalRevenue: c.revenue,
        completedOrders: c.count,
        cancelledOrders: cancelled,
        totalOrders: allOrders,
        avgOrderValue: Math.round(c.avgValue || 0),
        totalDiscount: c.totalDiscount,
        totalTax: c.totalTax,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/reports/daily — day-by-day revenue breakdown */
export async function getDailyReport(req, res, next) {
  try {
    const { from, to } = getDateRange(req.query);

    const rows = await Order.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
          avgValue: { $avg: '$total' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    const data = rows.map((r) => ({
      date: `${r._id.year}-${String(r._id.month).padStart(2, '0')}-${String(r._id.day).padStart(2, '0')}`,
      revenue: r.revenue,
      orders: r.orders,
      avgValue: Math.round(r.avgValue),
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/** GET /api/reports/items — top selling items */
export async function getItemsReport(req, res, next) {
  try {
    const { from, to } = getDateRange(req.query);
    const limit = parseInt(req.query.limit) || 20;

    const rows = await Order.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: from, $lte: to } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItem',
          name: { $first: '$items.name' },
          totalQty: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          avgPrice: { $avg: '$items.price' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalQty: -1 } },
      { $limit: limit },
    ]);

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

/** GET /api/reports/payment — revenue split by payment method */
export async function getPaymentReport(req, res, next) {
  try {
    const { from, to } = getDateRange(req.query);

    const rows = await Order.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: '$paymentMethod',
          revenue: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    // Also by order type
    const byType = await Order.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: '$orderType',
          revenue: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    res.json({ success: true, data: { byPaymentMethod: rows, byOrderType: byType } });
  } catch (err) {
    next(err);
  }
}

/** GET /api/reports/cashier — revenue per cashier */
export async function getCashierReport(req, res, next) {
  try {
    const { from, to } = getDateRange(req.query);

    const rows = await Order.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: '$cashier',
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
          avgValue: { $avg: '$total' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          revenue: 1,
          orders: 1,
          avgValue: { $round: ['$avgValue', 0] },
          name: '$user.name',
          role: '$user.role',
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}
