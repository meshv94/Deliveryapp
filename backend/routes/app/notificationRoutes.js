const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/app/notificationController');
const { verifyToken } = require('../../middlewares/authMiddleware');

// All notification routes require customer authentication
router.use(verifyToken);

// Get user notifications feed
router.get('/', notificationController.getUserNotifications);

// Mark all as read
router.put('/read-all', notificationController.markAllNotificationsAsRead);

// Mark specific notification as read
router.put('/:id/read', notificationController.markNotificationAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
