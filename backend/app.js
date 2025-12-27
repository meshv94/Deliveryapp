const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const { multerErrorHandler } = require('./middlewares/uploadMiddleware');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
const uploadPath = process.env.UPLOAD_PATH || './uploads';
app.use('/uploads', express.static(path.join(__dirname, uploadPath)));

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zamoto';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✓ MongoDB Connected Successfully');
  } catch (error) {
    console.error('✗ MongoDB Connection Failed:', error.message);
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

// Routes
// Admin Routes
const moduleRoutes = require('./routes/admin/moduleRoutes');
const vendorRoutes = require('./routes/admin/vendorRoutes');
const adminUserRoutes = require('./routes/admin/userRoutes');

// App Routes
const userRoutes = require('./routes/app/userRoutes');
const addressRoutes = require('./routes/app/addressRoutes');
const vendorAppRoutes = require('./routes/app/vendorRoutes');
const cartCheckoutRoutes = require('./routes/app/cartCheckoutRoute');

// Mount admin routes
app.use('/api/admin', moduleRoutes);
app.use('/api/admin', vendorRoutes);
app.use('/api/admin', adminUserRoutes);

// Mount app routes
app.use('/api/app', userRoutes);
app.use('/api/app', addressRoutes);
app.use('/api/app', vendorAppRoutes);
app.use('/api/app', cartCheckoutRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});


// Multer Error Handler
app.use(multerErrorHandler);

// 404 Route Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Server Configuration
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, HOST, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   Vendor Management API Server        ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}            ║
  ║   Port: ${PORT}                              ║
  ║   URL: http://${HOST}:${PORT}              ║
  ╚════════════════════════════════════════╝
  `);
});

// Graceful Shutdown
process.on('SIGINT', () => {
  console.log('\n✓ Shutting down gracefully...');
  mongoose.connection.close();
  process.exit(0);
});

module.exports = app;
