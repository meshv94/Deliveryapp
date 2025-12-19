const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { userId, timestamp: Date.now() },
    process.env.JWT_SECRET || 'your-secret-key-change-in-env',
    { expiresIn: '7d' }
  );
};

// Helper function to send OTP (Mock - Replace with actual SMS service)
const sendOtpToNumber = async (mobileNumber, otp) => {
  try {
    // Mock SMS service - In production, use Twilio, AWS SNS, or similar
    console.log(`📱 OTP sent to ${mobileNumber}: ${otp}`);
    
    // Uncomment below for Twilio integration
    
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    await client.messages.create({
      body: `Your OTP is: ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${mobileNumber}`
    });
    
    
    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { success: false, message: 'Failed to send OTP' };
  }
};

module.exports = {
  generateToken,
  sendOtpToNumber
};
