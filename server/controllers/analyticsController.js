import { Order } from '../models/Order.js';
import { MenuItem } from '../models/MenuItem.js';
import { Category } from '../models/Category.js';

/** GET /api/analytics/dashboard — Admin dashboard analytics & stats */
export async function getDashboardAnalytics(req, res, next) {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Parallel aggregations for speed
    const [
      totalStats,
      todayStats,
      totalCategories,
      totalMenuItems,
      recentOrders,
      topItemsAgg,
    ] = await Promise.all([
      // 1. Overall stats (Completed orders)
      Order.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$grandTotal' },
            totalOrders: { $sum: 1 },
            avgOrderValue: { $avg: '$grandTotal' },
          },
        },
      ]),

      // 2. Today's stats
      Order.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: { $gte: todayStart, $lte: todayEnd },
          },
        },
        {
          $group: {
            _id: null,
            todayRevenue: { $sum: '$grandTotal' },
            todayOrders: { $sum: 1 },
          },
        },
      ]),

      // 3. Counts
      Category.countDocuments(),
      MenuItem.countDocuments(),

      // 4. Recent 5 orders
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('cashier', 'name')
        .populate('table', 'name section'),

      // 5. Top 5 Selling Items
      Order.aggregate([
        { $match: { status: 'completed' } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.menuItem',
            name: { $first: '$items.name' },
            totalQuantity: { $sum: '$items.quantity' },
            totalSales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const overall = totalStats[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };
    const today = todayStats[0] || { todayRevenue: 0, todayOrders: 0 };

    res.json({
      success: true,
      data: {
        totalRevenue: overall.totalRevenue,
        totalOrders: overall.totalOrders,
        avgOrderValue: Math.round(overall.avgOrderValue),
        todayRevenue: today.todayRevenue,
        todayOrders: today.todayOrders,
        categoriesCount: totalCategories,
        menuItemsCount: totalMenuItems,
        topSellingItems: topItemsAgg,
        recentOrders,
      },
    });
  } catch (err) {
    next(err);
  }
}
