const walletService = require('../../utils/walletService');
const { getSystemSettings } = require('../../utils/systemSettingsService');

/**
 * Get customer wallet balance, stats, and transaction ledger
 * GET /api/app/wallet/ledger
 */
const getWalletLedger = async (req, res) => {
  try {
    const userId = req.user && (req.user._id || req.user.id || req.user);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { page = 1, limit = 20, type = null, category = null } = req.query;

    const data = await walletService.getWalletLedger(userId, {
      page,
      limit,
      type,
      category,
    });

    const settings = await getSystemSettings();

    return res.status(200).json({
      success: true,
      message: 'Wallet ledger fetched successfully',
      data: {
        ...data,
        isWalletEnabled: settings.walletSettings?.isWalletEnabled !== false,
        allowHybridPayment: settings.walletSettings?.allowHybridPayment !== false,
      },
    });
  } catch (error) {
    console.error('Error fetching wallet ledger:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet data',
      error: error.message,
    });
  }
};

/**
 * Get quick wallet balance summary
 * GET /api/app/wallet/balance
 */
const getWalletBalance = async (req, res) => {
  try {
    const userId = req.user && (req.user._id || req.user.id || req.user);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const data = await walletService.getWalletLedger(userId, { page: 1, limit: 1 });
    const settings = await getSystemSettings();

    const isWalletEnabled = settings.walletSettings?.isWalletEnabled !== false;
    const allowHybridPayment = settings.walletSettings?.allowHybridPayment !== false;
    const allowCheckoutUsage = isWalletEnabled && allowHybridPayment;

    return res.status(200).json({
      success: true,
      data: {
        balance: data.currentBalance,
        totalCredited: data.totalCredited,
        totalDebited: data.totalDebited,
        isWalletEnabled,
        allowHybridPayment,
        allowCheckoutUsage,
        autoRefundToWalletOnCancel: settings.walletSettings?.autoRefundToWalletOnCancel !== false,
      },
    });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet balance',
      error: error.message,
    });
  }
};

module.exports = {
  getWalletLedger,
  getWalletBalance,
};
