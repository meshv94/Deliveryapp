const Joi = require('joi');
const Cart = require('../../models/cartModal');
const { createOrderNotification } = require('../../utils/notificationService');
const walletService = require('../../utils/walletService');
const { getSystemSettings } = require('../../utils/systemSettingsService');

/**
 * Helper to process auto-refund to wallet on order cancellation
 */
const processOrderCancellationRefund = async (orderDoc, cancelReason = '') => {
  try {
    const settings = await getSystemSettings();
    const isAutoRefundEnabled = settings.walletSettings?.autoRefundToWalletOnCancel !== false;

    // Check if auto-refund is enabled and order has not already been refunded
    if (isAutoRefundEnabled && orderDoc && orderDoc.user && orderDoc.refunded_to !== 'wallet') {
      const refundAmount = Number(orderDoc.total_payable_amount || orderDoc.subtotal || 0);
      if (refundAmount > 0) {
        const userId = orderDoc.user._id || orderDoc.user;
        const shortOrderId = (orderDoc._id || '').toString().slice(-6).toUpperCase();

        await walletService.creditWallet({
          userId,
          amount: refundAmount,
          category: 'ORDER_REFUND',
          description: `Refund for cancelled order #${shortOrderId}${cancelReason ? ` (${cancelReason})` : ''}`,
          orderId: orderDoc._id,
        });

        // Update the order doc with refund details
        await Cart.findByIdAndUpdate(orderDoc._id, {
          payment_status: 'Refunded',
          refunded_to: 'wallet',
          refunded_amount: refundAmount,
          refunded_at: new Date(),
        });

        console.log(`[Wallet] Auto-refunded ₹${refundAmount} to user ${userId} for cancelled order #${shortOrderId}`);
        return { refunded: true, amount: refundAmount };
      }
    }
  } catch (err) {
    console.error('[Wallet] Failed to process auto-refund on order cancellation:', err);
  }
  return { refunded: false, amount: 0 };
};

// Validation Schema for updating order status
const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid(
      'New',
      'Placed',
      'Confirmed',
      'Preparing',
      'Processing',
      'Ready',
      'Out for Delivery',
      'Delivered',
      'Cancelled',
      'Refunded'
    )
    .required()
    .messages({
      'string.empty': 'Status is required',
      'any.required': 'Status is required',
      'any.only': 'Status must be one of: New, Placed, Confirmed, Preparing, Processing, Ready, Out for Delivery, Delivered, Cancelled, Refunded',
    }),
});

/**
 * Get all orders with optional filters
 * GET /api/admin/orders
 */
const getAllOrders = async (req, res) => {
  try {
    const { orderDate, deliveryDate, status, page = 1, limit = 100 } = req.query;

    // Build filter object
    const filter = {};

    // Filter by vendor access for non-super admins
    if (req.admin && req.admin.role !== 'super_admin') {
      const vendorIds = req.admin.vendor_ids.map(v => v._id || v);
      filter.vendor = { $in: vendorIds };
    }

    // Filter by order date (createdAt)
    if (orderDate) {
      const startDate = new Date(orderDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(orderDate);
      endDate.setHours(23, 59, 59, 999);

      filter.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    // Filter by delivery date
    if (deliveryDate) {
      const deliveryStartDate = new Date(deliveryDate);
      deliveryStartDate.setHours(0, 0, 0, 0);
      const deliveryEndDate = new Date(deliveryDate);
      deliveryEndDate.setHours(23, 59, 59, 999);

      filter.delivery_date = {
        $gte: deliveryStartDate,
        $lte: deliveryEndDate,
      };
    }

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // Only get orders that have been placed (not New carts)
    if (!status) {
      filter.status = { $ne: 'New' };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch orders with population
    const orders = await Cart.find(filter)
      .populate('user', 'name email mobile')
      .populate('vendor', 'name email mobile_number address vendor_image')
      .populate('address')
      .populate({
        path: 'items.product',
        select: 'name main_price special_price image',
      })
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalOrders = await Cart.countDocuments(filter);

    // Calculate statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats = {
      totalOrders: await Cart.countDocuments({ status: { $ne: 'New' } }),
      todayOrders: await Cart.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow },
        status: { $ne: 'New' },
      }),
      todayDeliveries: await Cart.countDocuments({
        delivery_date: { $gte: today, $lt: tomorrow },
        status: { $ne: 'New' },
      }),
      pendingOrders: await Cart.countDocuments({ status: { $in: ['Placed', 'Pending'] } }),
      deliveredOrders: await Cart.countDocuments({ status: 'Delivered' }),
      cancelledOrders: await Cart.countDocuments({ status: 'Cancelled' }),
    };

    return res.status(200).json({
      success: true,
      message: 'Orders fetched successfully',
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / parseInt(limit)),
        totalOrders,
        limit: parseInt(limit),
      },
      stats,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message,
    });
  }
};

/**
 * Get order by ID
 * GET /api/admin/orders/:id
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format',
      });
    }

    // Fetch order with full population
    const order = await Cart.findById(id)
      .populate('user', 'name email mobile_number')
      .populate('vendor', 'name email mobile_number address latitude longitude vendor_image')
      .populate('address')
      .populate({
        path: 'items.product',
        select: 'name main_price special_price image description',
      })
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check vendor access for non-super admins
    if (req.admin && req.admin.role !== 'super_admin') {
      const hasAccess = req.admin.vendor_ids.some(v => (v._id || v).toString() === order.vendor._id.toString());
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this order',
        });
      }
    }

    // Rename address to delivery_address for clarity
    if (order.address) {
      order.delivery_address = order.address;
      delete order.address;
    }

    // Rename delivery_date to deliveryDate for consistency
    if (order.delivery_date) {
      order.deliveryDate = order.delivery_date;
    }

    return res.status(200).json({
      success: true,
      message: 'Order details fetched successfully',
      data: order,
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      error: error.message,
    });
  }
};

/**
 * Update order status
 * PUT /api/admin/orders/:id/status
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format',
      });
    }

    // Validate request body
    const { error, value } = updateOrderStatusSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map((detail) => detail.message),
      });
    }

    const { status } = value;

    // First find the order to check vendor access
    const existingOrder = await Cart.findById(id).lean();

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check vendor access for non-super admins
    if (req.admin && req.admin.role !== 'super_admin') {
      const hasAccess = req.admin.vendor_ids.some(v => (v._id || v).toString() === existingOrder.vendor.toString());
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this order',
        });
      }
    }

    // Find and update order
    const order = await Cart.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('user', 'name email mobile')
      .populate('vendor', 'name email mobile_number')
      .lean();

    // If cancelled or refunded, process auto-refund to wallet
    if (status === 'Cancelled' || status === 'Refunded') {
      await processOrderCancellationRefund(order, 'Status updated to ' + status);
    }

    // Trigger customer notification asynchronously
    createOrderNotification(order, status).catch((err) =>
      console.error('Failed to dispatch order notification:', err)
    );

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message,
    });
  }
};

/**
 * Get order statistics
 * GET /api/admin/orders/stats
 */
const getOrderStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get current month range
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    // Build vendor filter for non-super admins
    const vendorFilter = {};
    if (req.admin && req.admin.role !== 'super_admin') {
      const vendorIds = req.admin.vendor_ids.map(v => v._id || v);
      vendorFilter.vendor = { $in: vendorIds };
    }

    const stats = {
      // Overall stats
      totalOrders: await Cart.countDocuments({ ...vendorFilter, status: { $ne: 'New' } }),
      totalRevenue: await Cart.aggregate([
        { $match: { ...vendorFilter, status: { $in: ['Placed', 'Delivered'] } } },
        { $group: { _id: null, total: { $sum: '$total_payable_amount' } } },
      ]).then((result) => result[0]?.total || 0),

      // Today's stats
      todayOrders: await Cart.countDocuments({
        ...vendorFilter,
        createdAt: { $gte: today, $lt: tomorrow },
        status: { $ne: 'New' },
      }),
      todayRevenue: await Cart.aggregate([
        {
          $match: {
            ...vendorFilter,
            createdAt: { $gte: today, $lt: tomorrow },
            status: { $in: ['Placed', 'Delivered'] },
          },
        },
        { $group: { _id: null, total: { $sum: '$total_payable_amount' } } },
      ]).then((result) => result[0]?.total || 0),
      todayDeliveries: await Cart.countDocuments({
        ...vendorFilter,
        delivery_date: { $gte: today, $lt: tomorrow },
        status: { $ne: 'New' },
      }),

      // This month's stats
      monthOrders: await Cart.countDocuments({
        ...vendorFilter,
        createdAt: { $gte: monthStart, $lte: monthEnd },
        status: { $ne: 'New' },
      }),
      monthRevenue: await Cart.aggregate([
        {
          $match: {
            ...vendorFilter,
            createdAt: { $gte: monthStart, $lte: monthEnd },
            status: { $in: ['Placed', 'Delivered'] },
          },
        },
        { $group: { _id: null, total: { $sum: '$total_payable_amount' } } },
      ]).then((result) => result[0]?.total || 0),

      // Status-wise breakdown
      pendingOrders: await Cart.countDocuments({ ...vendorFilter, status: { $in: ['Placed', 'Pending'] } }),
      deliveredOrders: await Cart.countDocuments({ ...vendorFilter, status: 'Delivered' }),
      cancelledOrders: await Cart.countDocuments({ ...vendorFilter, status: 'Cancelled' }),
    };

    return res.status(200).json({
      success: true,
      message: 'Order statistics fetched successfully',
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching order statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics',
      error: error.message,
    });
  }
};

/**
 * Delete order (soft delete by marking as cancelled)
 * DELETE /api/admin/orders/:id
 */
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format',
      });
    }

    // First find the order to check vendor access
    const existingOrder = await Cart.findById(id).lean();

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check vendor access for non-super admins
    if (req.admin && req.admin.role !== 'super_admin') {
      const hasAccess = req.admin.vendor_ids.some(v => (v._id || v).toString() === existingOrder.vendor.toString());
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this order',
        });
      }
    }

    // Find and update order status to Cancelled
    const order = await Cart.findByIdAndUpdate(
      id,
      { status: 'Cancelled', cancelled_by: 'admin', cancelled_at: new Date() },
      { new: true }
    );

    // Process auto-refund to wallet if enabled
    if (order) {
      await processOrderCancellationRefund(order, 'Cancelled by admin');
    }

    // Trigger customer notification asynchronously
    createOrderNotification(order, 'Cancelled', 'Cancelled by marketplace admin').catch((err) =>
      console.error('Failed to dispatch order notification:', err)
    );

    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message,
    });
  }
};

/**
 * Mark order as delivered
 * PUT /api/admin/orders/:id/deliver
 */
const markAsDelivered = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format',
      });
    }

    // Find order
    const order = await Cart.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check vendor access for non-super admins
    if (req.admin && req.admin.role !== 'super_admin') {
      const hasAccess = req.admin.vendor_ids.some(v => (v._id || v).toString() === order.vendor.toString());
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this order',
        });
      }
    }

    // Check if order can be delivered
    if (order.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot deliver a cancelled order',
      });
    }

    if (order.status === 'Delivered') {
      return res.status(400).json({
        success: false,
        message: 'Order is already delivered',
      });
    }

    // Update order status to Delivered
    order.status = 'Delivered';
    await order.save();

    // Populate for response
    const updatedOrder = await Cart.findById(id)
      .populate('user', 'name email mobile')
      .populate('vendor', 'name email mobile_number')
      .lean();

    // Trigger customer notification asynchronously
    createOrderNotification(updatedOrder, 'Delivered').catch((err) =>
      console.error('Failed to dispatch order notification:', err)
    );

    return res.status(200).json({
      success: true,
      message: 'Order marked as delivered successfully',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Error marking order as delivered:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark order as delivered',
      error: error.message,
    });
  }
};

/**
 * Cancel order with reason
 * PUT /api/admin/orders/:id/cancel
 */
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancel_reason } = req.body;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format',
      });
    }

    // Validate cancel reason
    if (!cancel_reason || cancel_reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Cancel reason is required',
      });
    }

    // Find order
    const order = await Cart.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check vendor access for non-super admins
    if (req.admin && req.admin.role !== 'super_admin') {
      const hasAccess = req.admin.vendor_ids.some(v => (v._id || v).toString() === order.vendor.toString());
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this order',
        });
      }
    }

    // Check if order can be cancelled
    if (order.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled',
      });
    }

    if (order.status === 'Delivered') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a delivered order',
      });
    }

    // Update order
    order.status = 'Cancelled';
    order.cancel_reason = cancel_reason.trim();
    order.cancelled_by = 'admin';
    order.cancelled_at = new Date();
    await order.save();

    // Process auto-refund to wallet if enabled
    await processOrderCancellationRefund(order, cancel_reason.trim());

    // Populate for response
    const updatedOrder = await Cart.findById(id)
      .populate('user', 'name email mobile')
      .populate('vendor', 'name email mobile_number')
      .lean();

    // Trigger customer notification asynchronously
    createOrderNotification(updatedOrder, 'Cancelled', cancel_reason.trim()).catch((err) =>
      console.error('Failed to dispatch order notification:', err)
    );

    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message,
    });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getOrderStats,
  deleteOrder,
  markAsDelivered,
  cancelOrder,
};
