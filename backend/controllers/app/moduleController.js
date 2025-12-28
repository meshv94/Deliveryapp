const Joi = require('joi');
const Module = require('../../models/moduleModal');

// Get active modules only
exports.getActiveModules = async (req, res) => {
  try {
    const modules = await Module.find({ active: true }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Active modules retrieved successfully',
      count: modules.length,
      data: modules
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving active modules',
      error: error.message
    });
  }
};

