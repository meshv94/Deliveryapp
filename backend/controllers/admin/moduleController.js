const Joi = require('joi');
const Module = require('../../models/moduleModal');

// Validation Schemas
const createModuleSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Module name is required',
    'any.required': 'Module name is required'
  }),
  active: Joi.boolean().optional(),
  image: Joi.string().optional().default('').messages({
      'string.base': 'image must be a string'
    }),
});

const updateModuleSchema = Joi.object({
  name: Joi.string().trim().optional(),
  active: Joi.boolean().optional(),
  image: Joi.string().optional().default(''),
}).or('name', 'active', 'image').messages({
  'object.missing': 'At least one field (name or active) is required to update'
});

// Create a new module
exports.createModule = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = createModuleSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { name, active } = value;

    // Check if module already exists
    const existingModule = await Module.findOne({ name });
    if (existingModule) {
      return res.status(409).json({
        success: false,
        message: 'Module with this name already exists'
      });
    }

    const module = new Module({
      name,
      active: active !== undefined ? active : true,
      image: req.file ? req.file.fileUrl : ''
    });

    const savedModule = await module.save();

    res.status(201).json({
      success: true,
      message: 'Module created successfully',
      data: savedModule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating module',
      error: error.message
    });
  }
};

// Get all modules
exports.getAllModules = async (req, res) => {
  try {
    const modules = await Module.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Modules retrieved successfully',
      count: modules.length,
      data: modules
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving modules',
      error: error.message
    });
  }
};

// Get module by ID
exports.getModuleById = async (req, res) => {
  try {
    const { id } = req.params;

    const module = await Module.findById(id);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Module retrieved successfully',
      data: module
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving module',
      error: error.message
    });
  }
};

// Update module
exports.updateModule = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate request body
    const { error, value } = updateModuleSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { name, active } = value;

    const module = await Module.findById(id);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Check if new name already exists (if name is being updated)
    if (name && name !== module.name) {
      const existingModule = await Module.findOne({ name });
      if (existingModule) {
        return res.status(409).json({
          success: false,
          message: 'Module with this name already exists'
        });
      }
      module.name = name;
    }

    if (active !== undefined) {
      module.active = active;
    }

    // Update image if a new file is uploaded
    if (req.file) {
      module.image = req.file.fileUrl;
    }

    const updatedModule = await module.save();

    res.status(200).json({
      success: true,
      message: 'Module updated successfully',
      data: updatedModule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating module',
      error: error.message
    });
  }
};

// Delete module
exports.deleteModule = async (req, res) => {
  try {
    const { id } = req.params;

    const module = await Module.findByIdAndDelete(id);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Module deleted successfully',
      data: module
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting module',
      error: error.message
    });
  }
};

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

// Get inactive modules only
exports.getInactiveModules = async (req, res) => {
  try {
    const modules = await Module.find({ active: false }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Inactive modules retrieved successfully',
      count: modules.length,
      data: modules
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving inactive modules',
      error: error.message
    });
  }
};
