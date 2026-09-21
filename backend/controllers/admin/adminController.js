const Joi = require('joi');
const Admin = require('../../models/adminModal');
const Vendor = require('../../models/vendorModal');
const jwt = require('jsonwebtoken');

// Validation Schemas
const addAdminSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 50 characters',
    'any.required': 'Name is required'
  }),
  email: Joi.string().email().required().lowercase().messages({
    'string.email': 'Please provide a valid email',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required'
  }),
  role: Joi.string().valid('super_admin', 'admin').optional().default('admin').messages({
    'any.only': 'Role must be either super_admin or admin'
  }),
  vendor_ids: Joi.array().items(Joi.string().hex().length(24)).optional().messages({
    'string.hex': 'Invalid vendor ID format',
    'string.length': 'Vendor ID must be 24 characters'
  }),
  assignedVendors: Joi.array().items(Joi.string().hex().length(24)).optional().messages({
    'string.hex': 'Invalid vendor ID format',
    'string.length': 'Vendor ID must be 24 characters'
  }),
  permissions: Joi.object({
    canManageOrders: Joi.boolean().optional().default(false),
    canManageProducts: Joi.boolean().optional().default(false),
    canUpdateVendor: Joi.boolean().optional().default(false)
  }).optional().default({
    canManageOrders: false,
    canManageProducts: false,
    canUpdateVendor: false
  })
});

const updateAdminSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).optional().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 50 characters'
  }),
  email: Joi.string().email().optional().lowercase().messages({
    'string.email': 'Please provide a valid email'
  }),
  password: Joi.string().min(6).optional().messages({
    'string.min': 'Password must be at least 6 characters'
  }),
  role: Joi.string().valid('super_admin', 'admin').optional().messages({
    'any.only': 'Role must be either super_admin or admin'
  }),
  vendor_ids: Joi.array().items(Joi.string().hex().length(24)).optional().messages({
    'string.hex': 'Invalid vendor ID format',
    'string.length': 'Vendor ID must be 24 characters'
  }),
  assignedVendors: Joi.array().items(Joi.string().hex().length(24)).optional().messages({
    'string.hex': 'Invalid vendor ID format',
    'string.length': 'Vendor ID must be 24 characters'
  }),
  isActive: Joi.boolean().optional(),
  isBlocked: Joi.boolean().optional(),
  permissions: Joi.object({
    canManageOrders: Joi.boolean().optional(),
    canManageProducts: Joi.boolean().optional(),
    canUpdateVendor: Joi.boolean().optional()
  }).optional()
}).min(1).messages({
  'object.min': 'At least one field is required to update'
});

const loginAdminSchema = Joi.object({
  email: Joi.string().email().required().lowercase().messages({
    'string.email': 'Please provide a valid email',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

const assignVendorsSchema = Joi.object({
  vendor_ids: Joi.array().items(Joi.string().hex().length(24)).min(1).required().messages({
    'array.min': 'At least one vendor ID is required',
    'any.required': 'Vendor IDs are required'
  })
});

// Add new admin
exports.addAdmin = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = addAdminSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Check if admin with email already exists
    const existingAdmin = await Admin.findOne({ email: value.email });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    // Normalize vendor IDs if provided
    const vendorIds = value.vendor_ids !== undefined ? value.vendor_ids : (value.assignedVendors || []);
    delete value.assignedVendors;
    value.vendor_ids = vendorIds;

    // Validate vendor IDs if provided
    if (value.vendor_ids && value.vendor_ids.length > 0) {
      const vendors = await Vendor.find({ _id: { $in: value.vendor_ids } });
      if (vendors.length !== value.vendor_ids.length) {
        return res.status(404).json({
          success: false,
          message: 'One or more vendor IDs are invalid'
        });
      }
    }

    // Create new admin
    const admin = new Admin(value);
    await admin.save();
    await admin.populate('vendor_ids', 'name email status');

    // Remove password from response
    const adminData = admin.toObject();
    delete adminData.password;

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: adminData
    });

  } catch (error) {
    console.error('Error adding admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding admin',
      error: error.message
    });
  }
};

// Update admin
exports.updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate request body
    const { error, value } = updateAdminSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Check if admin exists
    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check if email is being changed and if new email already exists
    if (value.email && value.email !== admin.email) {
      const existingAdmin = await Admin.findOne({
        email: value.email,
        _id: { $ne: id }
      });
      if (existingAdmin) {
        return res.status(409).json({
          success: false,
          message: 'Admin with this email already exists'
        });
      }
    }

    // Handle vendor IDs update (supports adding, updating, or clearing assigned vendors)
    const vendorIds = value.vendor_ids !== undefined ? value.vendor_ids : value.assignedVendors;
    if (vendorIds !== undefined) {
      // Validate vendor IDs if not empty
      if (vendorIds.length > 0) {
        const vendors = await Vendor.find({ _id: { $in: vendorIds } });
        if (vendors.length !== vendorIds.length) {
          return res.status(404).json({
            success: false,
            message: 'One or more vendor IDs are invalid'
          });
        }
      }
      admin.vendor_ids = vendorIds;
      delete value.vendor_ids;
      delete value.assignedVendors;
    }

    // Update admin fields
    Object.keys(value).forEach(key => {
      if (key === 'permissions') {
        admin.permissions = { ...admin.permissions, ...value.permissions };
      } else {
        admin[key] = value[key];
      }
    });

    await admin.save();
    await admin.populate('vendor_ids', 'name email status');

    // Remove password from response
    const adminData = admin.toObject();
    delete adminData.password;

    res.status(200).json({
      success: true,
      message: 'Admin updated successfully',
      data: adminData
    });

  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating admin',
      error: error.message
    });
  }
};

// Admin login
exports.loginAdmin = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = loginAdminSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Find admin with password field
    const admin = await Admin.findOne({ email: value.email }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if admin is blocked
    if (admin.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Please contact support.'
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(value.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        id: admin._id,
        email: admin.email,
        role: admin.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Remove password from response
    const adminData = admin.toObject();
    delete adminData.password;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        admin: adminData,
        token
      }
    });

  } catch (error) {
    console.error('Error in admin login:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
};

// Assign vendors to admin
exports.assignVendors = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate request body
    const { error, value } = assignVendorsSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Check if admin exists
    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Validate vendor IDs
    const vendors = await Vendor.find({ _id: { $in: value.vendor_ids } });
    if (vendors.length !== value.vendor_ids.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more vendor IDs are invalid'
      });
    }

    // Assign vendors
    await admin.assignVendors(value.vendor_ids);

    // Populate vendor details
    await admin.populate('vendor_ids', 'name email status');

    res.status(200).json({
      success: true,
      message: 'Vendors assigned successfully',
      data: admin
    });

  } catch (error) {
    console.error('Error assigning vendors:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning vendors',
      error: error.message
    });
  }
};

// Remove vendors from admin
exports.removeVendors = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate request body
    const { error, value } = assignVendorsSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Check if admin exists
    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Remove vendors
    await admin.removeVendors(value.vendor_ids);

    // Populate vendor details
    await admin.populate('vendor_ids', 'name email status');

    res.status(200).json({
      success: true,
      message: 'Vendors removed successfully',
      data: admin
    });

  } catch (error) {
    console.error('Error removing vendors:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing vendors',
      error: error.message
    });
  }
};

// Verify vendor (only if admin has permission)
exports.verifyVendor = async (req, res) => {
  try {
    const { adminId, vendorId } = req.params;

    // Check if admin exists
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check if admin has permission to verify vendors
    if (!admin.permissions.canVerifyVendors) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to verify vendors'
      });
    }

    // Check if admin has access to this vendor
    if (!admin.hasVendorAccess(vendorId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this vendor'
      });
    }

    // Check if vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Update vendor status to active (verified)
    vendor.status = 1;
    await vendor.save();

    res.status(200).json({
      success: true,
      message: 'Vendor verified successfully',
      data: vendor
    });

  } catch (error) {
    console.error('Error verifying vendor:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying vendor',
      error: error.message
    });
  }
};

// Get all admins
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find()
      .select('-password')
      .populate('vendor_ids', 'name email status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Admins retrieved successfully',
      data: admins,
      count: admins.length
    });

  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admins',
      error: error.message
    });
  }
};

// Get admin by ID
exports.getAdminById = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findById(id)
      .select('-password')
      .populate('vendor_ids', 'name email status');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Admin retrieved successfully',
      data: admin
    });

  } catch (error) {
    console.error('Error fetching admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin',
      error: error.message
    });
  }
};

// Delete admin
exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findByIdAndDelete(id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Admin deleted successfully',
      data: admin
    });

  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting admin',
      error: error.message
    });
  }
};
