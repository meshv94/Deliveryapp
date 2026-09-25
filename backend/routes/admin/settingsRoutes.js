const express = require('express');
const router = express.Router();
const settingsController = require('../../controllers/admin/settingsController');
const { verifyAdminToken, checkPermission } = require('../../middlewares/adminAuthMiddleware');

// Get system settings
router.get('/system', verifyAdminToken, settingsController.getSettings);

// Update system settings (Super Admin only)
router.put(
  '/system',
  verifyAdminToken,
  checkPermission('canManageSettings'),
  settingsController.updateSettings
);

// Manual wallet adjustment
router.post(
  '/wallet/adjustment',
  verifyAdminToken,
  checkPermission('canManageUsers'),
  settingsController.manualWalletAdjustment
);

module.exports = router;
