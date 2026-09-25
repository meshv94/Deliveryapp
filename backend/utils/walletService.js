const User = require('../models/userModal');
const WalletTransaction = require('../models/walletTransactionModal');

/**
 * Credit an amount to a customer's wallet atomically
 * @param {Object} params
 * @param {string} params.userId
 * @param {number} params.amount
 * @param {string} params.category - 'ORDER_REFUND', 'CASHBACK', etc.
 * @param {string} params.description
 * @param {string} [params.orderId]
 * @param {Object} [params.metadata]
 */
const creditWallet = async ({
  userId,
  amount,
  category = 'ORDER_REFUND',
  description = 'Amount credited to wallet',
  orderId = null,
  metadata = {},
}) => {
  const numericAmount = Math.round(Number(amount) * 100) / 100;
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error('Valid positive amount is required for wallet credit');
  }

  // Atomically fetch and increment user's balance
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found for wallet credit');
  }

  const balanceBefore = Number(user.wallet_balance || 0);
  const balanceAfter = Math.round((balanceBefore + numericAmount) * 100) / 100;

  user.wallet_balance = balanceAfter;
  await user.save();

  // Create immutable ledger record
  const transaction = await WalletTransaction.create({
    user: userId,
    amount: numericAmount,
    type: 'CREDIT',
    category,
    order: orderId,
    description,
    balanceBefore,
    balanceAfter,
    status: 'SUCCESS',
    metadata,
  });

  return {
    success: true,
    newBalance: balanceAfter,
    transaction,
  };
};

/**
 * Debit an amount from a customer's wallet atomically
 * @param {Object} params
 * @param {string} params.userId
 * @param {number} params.amount
 * @param {string} params.category - 'ORDER_PAYMENT', etc.
 * @param {string} params.description
 * @param {string} [params.orderId]
 * @param {Object} [params.metadata]
 */
const debitWallet = async ({
  userId,
  amount,
  category = 'ORDER_PAYMENT',
  description = 'Paid for order using wallet balance',
  orderId = null,
  metadata = {},
}) => {
  const numericAmount = Math.round(Number(amount) * 100) / 100;
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error('Valid positive amount is required for wallet debit');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found for wallet debit');
  }

  const balanceBefore = Number(user.wallet_balance || 0);

  if (balanceBefore < numericAmount) {
    throw new Error(`Insufficient wallet balance. Available: ₹${balanceBefore}, Required: ₹${numericAmount}`);
  }

  const balanceAfter = Math.round((balanceBefore - numericAmount) * 100) / 100;

  user.wallet_balance = balanceAfter;
  await user.save();

  const transaction = await WalletTransaction.create({
    user: userId,
    amount: numericAmount,
    type: 'DEBIT',
    category,
    order: orderId,
    description,
    balanceBefore,
    balanceAfter,
    status: 'SUCCESS',
    metadata,
  });

  return {
    success: true,
    newBalance: balanceAfter,
    transaction,
  };
};

/**
 * Get customer wallet balance and detailed ledger history
 */
const getWalletLedger = async (userId, { page = 1, limit = 20, type = null, category = null } = {}) => {
  const user = await User.findById(userId).select('name email mobile_number wallet_balance');
  if (!user) {
    throw new Error('User not found');
  }

  const filter = { user: userId };
  if (type && ['CREDIT', 'DEBIT'].includes(type.toUpperCase())) {
    filter.type = type.toUpperCase();
  }
  if (category) {
    filter.category = category;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [transactions, total] = await Promise.all([
    WalletTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('order', 'total_payable_amount status createdAt')
      .lean(),
    WalletTransaction.countDocuments(filter),
  ]);

  // Compute quick aggregate stats
  const aggregates = await WalletTransaction.aggregate([
    { $match: { user: user._id, status: 'SUCCESS' } },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  let totalCredited = 0;
  let totalDebited = 0;
  aggregates.forEach((agg) => {
    if (agg._id === 'CREDIT') totalCredited = agg.totalAmount;
    if (agg._id === 'DEBIT') totalDebited = agg.totalAmount;
  });

  return {
    currentBalance: Number(user.wallet_balance || 0),
    totalCredited: Math.round(totalCredited * 100) / 100,
    totalDebited: Math.round(totalDebited * 100) / 100,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
    transactions,
  };
};

module.exports = {
  creditWallet,
  debitWallet,
  getWalletLedger,
};
