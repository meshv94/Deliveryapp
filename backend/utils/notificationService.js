const Notification = require('../models/notificationModal');
const Cart = require('../models/cartModal');

/**
 * Creates customer notification for order status updates
 * @param {Object|String} orderOrId - Populated order object or Order ID
 * @param {String} newStatus - New order status (e.g. 'Placed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled')
 * @param {String} [reason] - Optional cancellation/rejection reason
 * @returns {Promise<Object>} Created notification document
 */
const createOrderNotification = async (orderOrId, newStatus, reason = '') => {
  try {
    let order = orderOrId;
    if (typeof orderOrId === 'string' || (orderOrId && !orderOrId.vendor?.name && !orderOrId.user?._id)) {
      order = await Cart.findById(orderOrId)
        .populate('user', 'name email mobile_number')
        .populate('vendor', 'name vendor_image')
        .lean();
    }

    if (!order || !order.user) {
      console.warn('⚠️ Cannot create order notification: Invalid order or missing user');
      return null;
    }

    const userId = order.user._id || order.user;
    const vendorName = order.vendor?.name || 'AapnuBazaar Store';
    const orderShortId = order._id ? order._id.toString().slice(-6).toUpperCase() : 'ORDER';
    const normalizedStatus = String(newStatus || '').trim();
    const sLower = normalizedStatus.toLowerCase();

    let title = `Order Update #${orderShortId}`;
    let message = `Your order #${orderShortId} status has been updated to ${normalizedStatus}.`;
    let type = 'order_status_update';

    switch (sLower) {
      case 'placed':
      case 'new':
        title = `🎉 Order Placed #${orderShortId}`;
        message = `Your order has been received by ${vendorName}. We'll notify you once they start preparing.`;
        type = 'order_placed';
        break;

      case 'preparing':
      case 'processing':
      case 'confirmed':
        title = `🍳 Kitchen Cooking #${orderShortId}`;
        message = `${vendorName} accepted your order and is now preparing your delicious food!`;
        type = 'order_preparing';
        break;

      case 'ready':
      case 'out for delivery':
      case 'out_for_delivery':
      case 'shipped':
        title = `🛵 Out for Delivery #${orderShortId}`;
        message = `Good news! Your order from ${vendorName} is packed and on the way to your delivery address.`;
        type = 'order_out_for_delivery';
        break;

      case 'delivered':
        title = `✅ Order Delivered #${orderShortId}`;
        message = `Your order from ${vendorName} has arrived. Enjoy your meal!`;
        type = 'order_delivered';
        break;

      case 'cancelled':
      case 'rejected':
        title = `❌ Order Cancelled #${orderShortId}`;
        message = reason
          ? `Your order from ${vendorName} was cancelled: ${reason}`
          : `Your order from ${vendorName} could not be fulfilled and has been cancelled.`;
        type = 'order_cancelled';
        break;

      default:
        title = `📦 Order Status Update #${orderShortId}`;
        message = `Your order from ${vendorName} is currently ${normalizedStatus}.`;
        type = 'order_status_update';
        break;
    }

    const notification = await Notification.create({
      user: userId,
      order: order._id,
      title,
      message,
      type,
      status: normalizedStatus,
      is_read: false,
      metadata: {
        vendorName,
        totalAmount: order.total_payable_amount || 0,
        itemsCount: order.items?.length || 0,
        updatedAt: new Date(),
      },
    });

    console.log(`🔔 Created customer notification for User ${userId}: "${title}"`);
    return notification;
  } catch (error) {
    console.error('❌ Failed to create order notification:', error);
    return null;
  }
};

module.exports = {
  createOrderNotification,
};
