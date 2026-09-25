const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Amount must be greater than 0'],
    },
    type: {
      type: String,
      enum: ['CREDIT', 'DEBIT'],
      required: true,
    },
    category: {
      type: String,
      enum: [
        'ORDER_REFUND',
        'ORDER_PAYMENT',
        'ADMIN_ADJUSTMENT',
        'CASHBACK',
        'SIGNUP_BONUS',
        'PROMOTIONAL',
      ],
      default: 'ORDER_REFUND',
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cart',
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    balanceBefore: {
      type: Number,
      required: true,
      default: 0,
    },
    balanceAfter: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'PENDING', 'FAILED', 'REVERSED'],
      default: 'SUCCESS',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Indexes for fast querying & pagination
walletTransactionSchema.index({ user: 1, createdAt: -1 });
walletTransactionSchema.index({ order: 1 });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
