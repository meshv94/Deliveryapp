const express = require('express');
const router = express.Router();
const cartCheckoutController = require('../../controllers/app/cartCheckoutController');
const { verifyToken } = require('../../middlewares/authMiddleware');

// Require auth to use user's default address for proximity sorting
router.post('/checkout', verifyToken, cartCheckoutController.checkout);
module.exports = router;
