const express = require('express');
const router = express.Router();
const moduleController = require('../../controllers/admin/moduleController');
const { upload } = require('../../middlewares/uploadMiddleware');


// CRUD Operations
// Create a new module
router.post('/modules', upload.single('image'), moduleController.createModule);

// Get all modules
router.get('/modules', moduleController.getAllModules);

// Get active modules
router.get('/modules/active/list', moduleController.getActiveModules);

// Get inactive modules
router.get('/modules/inactive/list', moduleController.getInactiveModules);

// Get module by ID
router.get('/modules/:id', moduleController.getModuleById);

// Update module
router.put('/modules/:id', upload.single('image'), moduleController.updateModule);

// Delete module
router.delete('/modules/:id', moduleController.deleteModule);

module.exports = router;
