const express = require('express');
const router = express.Router();
const userController = require('../../controllers/admin/userController');

// User Statistics
router.get('/users/stats', userController.getUserStats);

// Get all users
router.get('/users', userController.getAllUsers);

// Get user by ID
router.get('/users/:id', userController.getUserById);

// Update user
router.put('/users/:id', userController.updateUser);

// Delete user
router.delete('/users/:id', userController.deleteUser);

// Block/Unblock user
router.put('/users/:id/toggle-block', userController.toggleBlockUser);

module.exports = router;
