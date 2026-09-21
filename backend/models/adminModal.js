const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Admin name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: ['super_admin', 'admin'],
      default: 'admin'
    },
    vendor_ids: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor'
    }],
    permissions: {
      canManageOrders: {
        type: Boolean,
        default: false
      },
      canManageProducts: {
        type: Boolean,
        default: false
      },
      canUpdateVendor: {
        type: Boolean,
        default: false
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    lastLogin: {
      type: Date,
      default: null
    },
    profileImage: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

// Index for efficient queries
adminSchema.index({ email: 1 });
adminSchema.index({ vendor_ids: 1 });

// Pre-save hook to hash password
adminSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
adminSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to check if admin has access to a specific vendor
adminSchema.methods.hasVendorAccess = function(vendorId) {
  if (this.role === 'super_admin') {
    return true; // Super admin has access to all vendors
  }
  return this.vendor_ids.some(id => id.toString() === vendorId.toString());
};

// Method to assign vendors to admin
adminSchema.methods.assignVendors = async function(vendorIds) {
  // Remove duplicates and add new vendor IDs
  const uniqueVendorIds = [...new Set([...this.vendor_ids.map(id => id.toString()), ...vendorIds])];
  this.vendor_ids = uniqueVendorIds;
  await this.save();
  return this;
};

// Method to remove vendors from admin
adminSchema.methods.removeVendors = async function(vendorIds) {
  this.vendor_ids = this.vendor_ids.filter(
    id => !vendorIds.includes(id.toString())
  );
  await this.save();
  return this;
};

// Virtual to get admin status text
adminSchema.virtual('statusText').get(function() {
  if (this.isBlocked) return 'Blocked';
  if (!this.isActive) return 'Inactive';
  return 'Active';
});

// Virtual to map vendor_ids to assignedVendors
adminSchema.virtual('assignedVendors').get(function() {
  return this.vendor_ids;
});

// Ensure virtuals are included in JSON
adminSchema.set('toJSON', { virtuals: true });
adminSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Admin', adminSchema);
