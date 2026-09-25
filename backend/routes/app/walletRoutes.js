const express = require('express');
const router = express.Router();
const walletController = require('../../controllers/app/walletController');
const { verifyToken } = require('../../middlewares/authMiddleware');

// All wallet routes require customer authentication
router.use(verifyToken);

// Get wallet balance and ledger history
router.get('/ledger', walletController.getWalletLedger);

// Get quick wallet balance summary
router.get('/balance', walletController.getWalletBalance);

module.exports = router;
