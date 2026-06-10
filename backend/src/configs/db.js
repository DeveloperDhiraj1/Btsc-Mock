const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const connString = process.env.MONGODB_URI;

    if (!connString) {
      throw new Error("MONGODB_URI missing in environment variables");
    }

    logger.info('Connecting to MongoDB...');

    const conn = await mongoose.connect(connString, {
      serverSelectionTimeoutMS: 5000
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    return conn;

  } catch (error) {
    logger.error('Database connection error:', error.message);

    logger.info('Server stopping due to DB connection failure');

    process.exit(1); // 🔥 IMPORTANT for production
  }
};

module.exports = connectDB;