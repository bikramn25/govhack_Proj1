const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
require('dotenv').config();

const searchRoutes = require('./routes/search');
const dataRoutes = require('./routes/data');
const uploadRoutes = require('./routes/upload');
const apiManagementRoutes = require('./routes/apiManagement');
const DataIndexer = require('./services/dataIndexer');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/search', searchRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/manage', apiManagementRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize data indexer
const dataIndexer = new DataIndexer();

// Make dataIndexer available to routes
app.locals.dataIndexer = dataIndexer;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Starting data indexing...`);
  
  try {
    await dataIndexer.initialize();
    console.log('✅ Data indexing completed successfully');
  } catch (error) {
    console.error('❌ Error during data indexing:', error.message);
  }
});

// Export dataIndexer for use in routes
module.exports.dataIndexer = dataIndexer;

module.exports = app;