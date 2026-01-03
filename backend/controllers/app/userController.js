const Joi = require('joi');
const User = require('../../models/userModal');
const Cart = require('../../models/cartModal');
const { generateToken, sendOtpToNumber } = require('../../services/authService');
const NODE_ENV = process.env.NODE_ENV

// Validation Schemas
const sendOtpSchema = Joi.object({
  mobile_number: Joi.string().required().regex(/^[6-9]\d{9}$/).messages({
    'string.empty': 'Mobile number is required',
    'any.required': 'Mobile number is required',
    'string.pattern.base': 'Please provide a valid 10-digit mobile number'
  }),
  name: Joi.string().trim().required().min(2).max(50).messages({
    'any.required': 'Name is required Please enter your name',
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 50 characters'
  }),
  email: Joi.string().email().optional().lowercase().messages({
    'string.email': 'Please provide a valid email'
  })
});

const verifyOtpSchema = Joi.object({
  mobile_number: Joi.string().required().regex(/^[6-9]\d{9}$/).messages({
    'string.empty': 'Mobile number is required',
    'any.required': 'Mobile number is required',
    'string.pattern.base': 'Please provide a valid 10-digit mobile number'
  }),
  otp: Joi.string().required().length(6).messages({
    'string.empty': 'OTP is required',
    'any.required': 'OTP is required',
    'string.length': 'OTP must be 6 digits'
  })
});

// Send OTP
exports.sendOtp = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = sendOtpSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { mobile_number, name, email } = value;

    // Check if user already exists
    let user = await User.findOne({ mobile_number });

    if (!user) {
      // Create new user for registration
      user = new User({
        mobile_number,
        name: name || '',
        email: email || undefined,
        isVerified: false
      });
    } else {
      // For existing user (login flow), just update name/email if provided
      if (name) user.name = name;
      if (email) user.email = email;
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Please contact support.'
      });
    }

    // Generate OTP
    const otp = user.generateOTP();
    console.log(`Generated OTP for ${mobile_number}: ${otp}`);

    // Save user
    await user.save();

    if (NODE_ENV == 'production') {
      // Send OTP to mobile number
      const otpResult = await sendOtpToNumber(mobile_number, otp);
      if (!otpResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP. Please try again.'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        mobile_number,
        otpExpireIn: '10 minutes'
      }
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending OTP',
      error: error.message
    });
  }
};

// Verify OTP - Handle both registration and login
exports.verifyOtp = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = verifyOtpSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { mobile_number, otp } = value;

    // Find user
    const user = await User.findOne({ mobile_number });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please send OTP first.'
      });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Please contact support.'
      });
    }

    // Verify OTP
    const verifyResult = user.verifyOTP(otp);

    if (!verifyResult.success) {
      await user.save();
      return res.status(400).json({
        success: false,
        message: verifyResult.message
      });
    }

    // OTP verified - Mark user as verified
    user.isVerified = true;
    await user.save();

    // Generate JWT Token
    const token = generateToken(user._id);

    // Determine if it's registration or login
    const isNewUser = !user.name || user.name.trim() === '';

    res.status(200).json({
      success: true,
      message: isNewUser ? 'Registration successful' : 'Login successful',
      data: {
        userId: user._id,
        mobile_number: user.mobile_number,
        name: user.name || null,
        email: user.email || null,
        isVerified: user.isVerified,
        token,
        tokenType: 'Bearer'
      }
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying OTP',
      error: error.message
    });
  }
};

// Get current user profile
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const user = await User.findById(userId).select('-otp -otpExpire');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: user
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const updateSchema = Joi.object({
      name: Joi.string().trim().min(2).max(50).optional(),
      email: Joi.string().email().optional().lowercase(),
      profileImage: Joi.string().optional()
    }).min(1);

    const { error, value } = updateSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Check if email is being changed and already exists
    if (value.email) {
      const existingUser = await User.findOne({ 
        email: value.email, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      value,
      { new: true, runValidators: true }
    ).select('-otp -otpExpire');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Logout (token blacklist can be implemented in production)
exports.logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging out',
      error: error.message
    });
  }
};

// Get My Orders - All orders except status = 'New'
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Find all orders (carts) for this user where status is not 'New'
    const orders = await Cart.find({
      user: userId,
      status: { $ne: 'New' }
    })
      .populate('vendor', 'name vendor_image address mobile_number')
      .populate('address', 'name address city pincode type')
      .populate('items.product', 'name image')
      .sort({ createdAt: -1 }); // Most recent first

    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: orders,
      count: orders.length
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};
