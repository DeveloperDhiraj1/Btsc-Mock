const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const connString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/btsc_mock';
    
    // In test environment, we might use memory-server or mock, but let's connect
    logger.info('Connecting to MongoDB: %s', connString.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
    
    const conn = await mongoose.connect(connString, {
      serverSelectionTimeoutMS: 5000 // fail fast if not running
    });
    
    logger.info(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    logger.error('Database connection error: ', error);
    
    if (process.env.NODE_ENV === 'test') {
      logger.info('Test environment: Continuing with in-memory database simulation mocks');
    } else {
      logger.error('Failed to connect to MongoDB. Please check if your database is running.');
      // Don't crash immediately to allow developer fallback/mock modes if database is not active
      logger.info('Continuing server initialization for simulation mock mode...');
    }
  }
};

module.exports = connectDB;
