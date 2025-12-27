const jwt = require('jsonwebtoken');
const User = require('../models/userModal');

// JWT Verification Middleware
const verifyToken = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-env');

    // Fetch user from DB using decoded.userId and attach to request
    const userId = decoded?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Invalid token payload' });
    }

    const user = await User.findById(userId).select('-otp -otpExpire');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Keep backward compatibility: include userId and decoded payload
    req.user = user.toObject();

    next();

  } catch (error) {
    console.log(error)
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

module.exports = {
  verifyToken
};
