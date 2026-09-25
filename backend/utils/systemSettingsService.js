const SystemSettings = require('../models/systemSettingsModal');

/**
 * Get or initialize system settings singleton
 */
const getSystemSettings = async () => {
  try {
    let settings = await SystemSettings.findOne({ key: 'GLOBAL_SETTINGS' });
    if (!settings) {
      settings = await SystemSettings.create({
        key: 'GLOBAL_SETTINGS',
        walletSettings: {
          isWalletEnabled: true,
          autoRefundToWalletOnCancel: true,
          allowHybridPayment: true,
          minRedeemAmount: 1,
        },
      });
    }
    return settings;
  } catch (error) {
    console.error('Error fetching system settings:', error);
    // Return safe fallback
    return {
      walletSettings: {
        isWalletEnabled: true,
        autoRefundToWalletOnCancel: true,
        allowHybridPayment: true,
        minRedeemAmount: 1,
      },
    };
  }
};

/**
 * Update system settings (Super Admin only)
 */
const updateSystemSettings = async (updates) => {
  try {
    let settings = await SystemSettings.findOne({ key: 'GLOBAL_SETTINGS' });
    if (!settings) {
      settings = new SystemSettings({ key: 'GLOBAL_SETTINGS' });
    }

    if (updates.walletSettings) {
      const current = settings.walletSettings || {};
      settings.walletSettings = {
        isWalletEnabled:
          updates.walletSettings.isWalletEnabled !== undefined
            ? Boolean(updates.walletSettings.isWalletEnabled)
            : current.isWalletEnabled !== false,
        autoRefundToWalletOnCancel:
          updates.walletSettings.autoRefundToWalletOnCancel !== undefined
            ? Boolean(updates.walletSettings.autoRefundToWalletOnCancel)
            : current.autoRefundToWalletOnCancel !== false,
        allowHybridPayment:
          updates.walletSettings.allowHybridPayment !== undefined
            ? Boolean(updates.walletSettings.allowHybridPayment)
            : current.allowHybridPayment !== false,
        minRedeemAmount:
          updates.walletSettings.minRedeemAmount !== undefined
            ? Number(updates.walletSettings.minRedeemAmount)
            : current.minRedeemAmount || 1,
      };
      settings.markModified('walletSettings');
    }

    await settings.save();
    return settings;
  } catch (error) {
    console.error('Error updating system settings:', error);
    throw error;
  }
};

module.exports = {
  getSystemSettings,
  updateSystemSettings,
};
