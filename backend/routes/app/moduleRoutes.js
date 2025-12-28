const express = require('express');
const router = express.Router();
const moduleController = require('../../controllers/admin/moduleController');

// Get active modules
router.get('/modules/active/list', moduleController.getActiveModules);


module.exports = router;
