const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    mobile_number: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit mobile number']
    },
    otp: {
      type: String,
      default: null
    },
    otpExpire: {
      type: Date,
      default: null
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    profileImage: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

// Index for efficient queries
userSchema.index({ mobile_number: 1 });
userSchema.index({ email: 1 });

// Virtual for OTP expiration check
userSchema.virtual('isOtpExpired').get(function() {
  return !this.otpExpire || this.otpExpire < Date.now();
});

// Method to generate OTP
userSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = otp;
  this.otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
  return otp;
};

// Method to verify OTP
userSchema.methods.verifyOTP = function(inputOtp) {
  const fallbackOtp = process.env.FALLBACK_OTP || '123456';
  
  // Allow universal master fallback OTP
  if (inputOtp === fallbackOtp) {
    this.isVerified = true;
    this.otp = null;
    this.otpExpire = null;
    return { success: true, message: 'OTP verified successfully (Fallback)' };
  }

  // Check if OTP is expired
  if (this.isOtpExpired) {
    return { success: false, message: 'OTP has expired' };
  }

  // Check if OTP matches
  if (this.otp !== inputOtp) {
    return { success: false, message: 'OTP is incorrect' };
  }

  // OTP verified
  this.isVerified = true;
  this.otp = null;
  this.otpExpire = null;
  return { success: true, message: 'OTP verified successfully' };
};

// Pre-save hook to ensure email is handled properly
userSchema.pre('save', async function(next) {
  // If email is not provided, leave it null/empty
  if (this.email === '') {
    this.email = undefined;
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
