const { getSystemSettings, updateSystemSettings } = require('../../utils/systemSettingsService');
const walletService = require('../../utils/walletService');

/**
 * Get global marketplace system settings (including Wallet toggles)
 * GET /api/admin/settings/system
 */
const getSettings = async (req, res) => {
  try {
    const settings = await getSystemSettings();
    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message,
    });
  }
};

/**
 * Update global marketplace system settings (Super Admin only)
 * PUT /api/admin/settings/system
 */
const updateSettings = async (req, res) => {
  try {
    const { walletSettings } = req.body;
    const updated = await updateSystemSettings({ walletSettings });

    return res.status(200).json({
      success: true,
      message: 'System settings updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message,
    });
  }
};

/**
 * Manual Admin Wallet Adjustment (Customer Support Credit/Debit)
 * POST /api/admin/settings/wallet/adjustment
 */
const manualWalletAdjustment = async (req, res) => {
  try {
    if (req.admin && req.admin.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Administrators can perform manual wallet adjustments',
      });
    }

    const { userId, amount, type, description } = req.body;
    if (!userId || !amount || !type) {
      return res.status(400).json({
        success: false,
        message: 'userId, amount, and type (CREDIT/DEBIT) are required',
      });
    }

    let result;
    if (type.toUpperCase() === 'CREDIT') {
      result = await walletService.creditWallet({
        userId,
        amount,
        category: 'ADMIN_ADJUSTMENT',
        description: description || 'Customer care credit adjustment',
      });
    } else {
      result = await walletService.debitWallet({
        userId,
        amount,
        category: 'ADMIN_ADJUSTMENT',
        description: description || 'Customer care debit adjustment',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully adjusted customer wallet: ${type} ₹${amount}`,
      data: result,
    });
  } catch (error) {
    console.error('Error adjusting wallet:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to adjust wallet',
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  manualWalletAdjustment,
};
