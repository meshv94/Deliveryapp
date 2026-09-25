const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'GLOBAL_SETTINGS',
    },
    walletSettings: {
      isWalletEnabled: {
        type: Boolean,
        default: true,
      },
      autoRefundToWalletOnCancel: {
        type: Boolean,
        default: true, // Super Admin toggle for auto-refunding to wallet on cancellation
      },
      allowHybridPayment: {
        type: Boolean,
        default: true,
      },
      minRedeemAmount: {
        type: Number,
        default: 1,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
