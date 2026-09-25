const Cart = require('../../models/cartModal');
const Vendor = require('../../models/vendorModal');
const Product = require('../../models/productModal');
const User = require('../../models/userModal');

/**
 * Get comprehensive dashboard statistics
 * GET /api/admin/dashboard/overview
 */
const getDashboardOverview = async (req, res) => {
  try {
    // Get date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get current month range
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get last 7 days range
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);

    // Get last 30 days range
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);

    // ==================== OVERALL STATISTICS ====================
    const totalVendors = await Vendor.countDocuments({ status: 1 });
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments();
    const totalOrders = await Cart.countDocuments({ status: { $ne: 'New' } });

    // Total Revenue
    const totalRevenueResult = await Cart.aggregate([
      { $match: { status: { $in: ['Placed', 'Delivered'] } } },
      { $group: { _id: null, total: { $sum: '$total_payable_amount' } } },
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // ==================== TODAY'S STATISTICS ====================
    const todayOrders = await Cart.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
      status: { $ne: 'New' },
    });

    const todayRevenueResult = await Cart.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow },
          status: { $in: ['Placed', 'Delivered'] },
        },
      },
      { $group: { _id: null, total: { $sum: '$total_payable_amount' } } },
    ]);
    const todayRevenue = todayRevenueResult[0]?.total || 0;

    const todayDeliveries = await Cart.countDocuments({
      delivery_date: { $gte: today, $lt: tomorrow },
      status: { $ne: 'New' },
    });

    // ==================== THIS MONTH'S STATISTICS ====================
    const monthOrders = await Cart.countDocuments({
      createdAt: { $gte: monthStart, $lte: monthEnd },
      status: { $ne: 'New' },
    });

    const monthRevenueResult = await Cart.aggregate([
      {
        $match: {
          createdAt: { $gte: monthStart, $lte: monthEnd },
          status: { $in: ['Placed', 'Delivered'] },
        },
      },
      { $group: { _id: null, total: { $sum: '$total_payable_amount' } } },
    ]);
    const monthRevenue = monthRevenueResult[0]?.total || 0;

    // ==================== STATUS-WISE BREAKDOWN ====================
    const pendingOrders = await Cart.countDocuments({ status: 'Placed' });
    const deliveredOrders = await Cart.countDocuments({ status: 'Delivered' });
    const cancelledOrders = await Cart.countDocuments({ status: 'Cancelled' });

    // ==================== TOP VENDORS (by revenue) ====================
    const topVendors = await Cart.aggregate([
      {
        $match: {
          status: { $in: ['Placed', 'Delivered'] },
        },
      },
      {
        $group: {
          _id: '$vendor',
          totalRevenue: { $sum: '$total_payable_amount' },
          totalOrders: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'vendors',
          localField: '_id',
          foreignField: '_id',
          as: 'vendorDetails',
        },
      },
      { $unwind: '$vendorDetails' },
      {
        $project: {
          _id: 1,
          name: '$vendorDetails.name',
          email: '$vendorDetails.email',
          vendor_image: '$vendorDetails.vendor_image',
          totalRevenue: 1,
          totalOrders: 1,
        },
      },
    ]);

    // ==================== TOP PRODUCTS (by quantity sold) ====================
    const topProducts = await Cart.aggregate([
      {
        $match: {
          status: { $in: ['Placed', 'Delivered'] },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.item_total' },
          productName: { $first: '$items.name' },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      {
        $project: {
          _id: 1,
          name: {
            $ifNull: [
              { $arrayElemAt: ['$productDetails.name', 0] },
              '$productName',
            ],
          },
          image: { $arrayElemAt: ['$productDetails.image', 0] },
          totalQuantity: 1,
          totalRevenue: 1,
        },
      },
    ]);

    // ==================== TOP USERS (by total spent) ====================
    const topUsers = await Cart.aggregate([
      {
        $match: {
          status: { $in: ['Placed', 'Delivered'] },
        },
      },
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$total_payable_amount' },
          totalOrders: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      { $unwind: '$userDetails' },
      {
        $project: {
          _id: 1,
          name: '$userDetails.name',
          email: '$userDetails.email',
          mobile: '$userDetails.mobile',
          totalSpent: 1,
          totalOrders: 1,
        },
      },
    ]);

    // ==================== DAILY ORDERS (Last 7 Days) ====================
    const dailyOrders = await Cart.aggregate([
      {
        $match: {
          createdAt: { $gte: last7Days },
          status: { $ne: 'New' },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
          revenue: { $sum: '$total_payable_amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill in missing days with zero values
    const filledDailyOrders = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const existingDay = dailyOrders.find((d) => d._id === dateStr);
      filledDailyOrders.push({
        date: dateStr,
        count: existingDay?.count || 0,
        revenue: existingDay?.revenue || 0,
      });
    }

    // ==================== RECENT ORDERS ====================
    const recentOrders = await Cart.find({ status: { $ne: 'New' } })
      .populate('user', 'name email')
      .populate('vendor', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id user vendor total_payable_amount status createdAt')
      .lean();

    // ==================== HOURLY DISTRIBUTION (Last 30 Days) ====================
    const hourlyData = await Cart.aggregate([
      {
        $match: {
          createdAt: { $gte: last30Days },
          status: { $ne: 'New' },
        },
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          orders: { $sum: 1 },
          revenue: { $sum: '$total_payable_amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => {
      const match = hourlyData.find((h) => h._id === hour);
      return {
        hour,
        label: `${hour.toString().padStart(2, '0')}:00`,
        orders: match ? match.orders : 0,
        revenue: match ? match.revenue : 0,
      };
    });

    // ==================== RESPONSE ====================
    return res.status(200).json({
      success: true,
      message: 'Dashboard data fetched successfully',
      data: {
        // Overall stats
        overview: {
          totalVendors,
          totalProducts,
          totalUsers,
          totalOrders,
          totalRevenue,
          pendingOrders,
          deliveredOrders,
          cancelledOrders,
        },

        // Today's stats
        today: {
          orders: todayOrders,
          revenue: todayRevenue,
          deliveries: todayDeliveries,
        },

        // This month's stats
        thisMonth: {
          orders: monthOrders,
          revenue: monthRevenue,
        },

        // Top performers
        topVendors,
        topProducts,
        topUsers,

        // Charts data
        dailyOrders: filledDailyOrders,
        hourlyDistribution,
        recentOrders,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message,
    });
  }
};

/**
 * Get revenue statistics for charts
 * GET /api/admin/dashboard/revenue-stats
 */
const getRevenueStats = async (req, res) => {
  try {
    const { period = '7days' } = req.query;

    let startDate;
    const endDate = new Date();
    let numDays = 7;

    // Determine date range based on period
    switch (period) {
      case '7days':
        numDays = 7;
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '30days':
        numDays = 30;
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '90days':
        numDays = 90;
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 89);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '1year':
      case 'year':
        numDays = 365;
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 364);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'thisMonth':
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        numDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        break;
      case 'lastMonth':
        startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1);
        endDate.setDate(0);
        numDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        break;
      default:
        numDays = 7;
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
    }

    // Get revenue data
    const revenueData = await Cart.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $ne: 'New' },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          revenue: { $sum: '$total_payable_amount' },
          count: { $sum: 1 },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill in dates for daily stats
    const filledStats = [];
    if (numDays <= 30) {
      for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date(endDate);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const existing = revenueData.find((r) => r._id === dateStr);
        filledStats.push({
          date: dateStr,
          count: existing?.count || existing?.orders || 0,
          orders: existing?.orders || existing?.count || 0,
          revenue: existing?.revenue || 0,
        });
      }
    } else {
      if (revenueData.length > 0) {
        revenueData.forEach((r) => {
          filledStats.push({
            date: r._id,
            count: r.count || r.orders || 0,
            orders: r.orders || r.count || 0,
            revenue: r.revenue || 0,
          });
        });
      }
    }

    const totalPeriodRevenue = revenueData.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
    const totalPeriodOrders = revenueData.reduce((acc, curr) => acc + (curr.count || curr.orders || 0), 0);

    return res.status(200).json({
      success: true,
      message: 'Revenue statistics fetched successfully',
      data: {
        period,
        totalRevenue: totalPeriodRevenue,
        totalOrders: totalPeriodOrders,
        dailyStats: filledStats,
      },
    });
  } catch (error) {
    console.error('Error fetching revenue statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue statistics',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardOverview,
  getRevenueStats,
};
