const express = require('express');
const router = express.Router();
const addressController = require('../../controllers/app/addressController');
const { verifyToken } = require('../../middlewares/authMiddleware');

// All routes require authentication
// router.use(verifyToken);

// Get all addresses for user
router.get('/addresses', verifyToken, addressController.getAddresses);

// Add new address
router.post('/addresses', verifyToken, addressController.addAddress);

// Update address
router.put('/addresses/:id', verifyToken, addressController.updateAddress);

// Delete address
router.delete('/addresses/:id', verifyToken, addressController.deleteAddress);

module.exports = router;
