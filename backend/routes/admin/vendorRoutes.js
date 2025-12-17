const express = require('express');
const router = express.Router();
const vendorController = require('../../controllers/admin/vendorController');
const { upload } = require('../../middlewares/uploadMiddleware');

// CRUD Operations

// Create a new vendor
router.post('/vendors', upload.single('vendor_image'), vendorController.createVendor);

// Get all vendors
router.get('/vendors', vendorController.getAllVendors);

// Get vendors by module
router.get('/vendors/module/:moduleId', vendorController.getVendorsByModule);

// Get all products for a vendor (admin)
router.get('/vendors/:id/products', vendorController.getProductsByVendor);

// Get vendor by ID
router.get('/vendors/:id', vendorController.getVendorById);

// Update vendor
router.put('/vendors/:id', upload.single('vendor_image'), vendorController.updateVendor);

// Delete vendor
router.delete('/vendors/:id', vendorController.deleteVendor);

// Product routes (admin)
router.post('/products', upload.single('image'), vendorController.createProduct);
router.get('/products', vendorController.getProducts);
router.get('/products/:id', vendorController.getProductById);
router.put('/products/:id', upload.single('image'), vendorController.updateProduct);
router.delete('/products/:id', vendorController.deleteProduct);

module.exports = router;
