const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
if (nodeEnv === 'production') {
  dotenv.config({ path: path.join(__dirname, '.env.production') });
} else {
  dotenv.config({ path: path.join(__dirname, '.env.development') });
}

const logger = require('./src/utils/logger');
const connectDB = require('./src/configs/db');
const { apiLimiter } = require('./src/middlewares/rateLimiter');
const { errorHandler } = require('./src/middlewares/error.middleware');
const { initQueues } = require('./src/jobs/queue');
const { initSocket } = require('./src/socket/socketHandler');

// Swagger Documentation Modules
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./src/docs/swagger');

// Initialize Express App
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Attach Socket.io handlers
initSocket(io);

// Initialize Background Job Queues
initQueues();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false // Allow loading local uploads on frontend image elements
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate Limiting
app.use('/api/', apiLimiter);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom Cookie Parser Middleware (removes external cookie-parser library dependency)
app.use((req, res, next) => {
  req.cookies = {};
  if (req.headers.cookie) {
    const rawCookies = req.headers.cookie.split(';');
    for (const cookie of rawCookies) {
      const parts = cookie.split('=');
      if (parts.length >= 2) {
        req.cookies[parts[0].trim()] = parts.slice(1).join('=').trim();
      }
    }
  }
  next();
});

// Serve Local Uploads Folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger Documentation API Explorer
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Route Handlers
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/questions', require('./src/routes/question.routes'));
app.use('/api/tests', require('./src/routes/test.routes'));
app.use('/api/ai', require('./src/routes/ai.routes'));
app.use('/api/payments', require('./src/routes/payment.routes'));
app.use('/api/admin', require('./src/routes/admin.routes'));

// Simple Healthcheck Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', env: process.env.NODE_ENV });
});

// Route Fallback
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'API Route Not Found' });
});

// Global Error Handler Middleware
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;

const startServer = () => {
  connectDB();

  return new Promise((resolve) => {
    server.listen(PORT, () => {
      logger.info(`Server started in ${nodeEnv} mode on port ${PORT}`);
      logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
      resolve(server);
    });
  });
};

if (require.main === module) {
  startServer();
}

module.exports = { app, server, startServer };
