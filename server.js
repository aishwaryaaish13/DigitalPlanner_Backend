import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';

// Import middleware
import { notFoundMiddleware, errorHandler } from './middleware/errorMiddleware.js';

// Import socket configuration
import { initializeSocket } from './config/socket.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import journalRoutes from './routes/journalRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import habitRoutes from './routes/habitRoutes.js';
import moodRoutes from './routes/moodRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import productivityRoutes from './routes/productivityRoutes.js';


// Initialize Express app
const app = express();

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
initializeSocket(httpServer);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/moods', moodRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/productivity', productivityRoutes);

// 404 Not Found middleware
app.use(notFoundMiddleware);

// Global error handling middleware
app.use(errorHandler);

// Server configuration
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Start server
const server = httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${NODE_ENV} mode`);
  console.log(`WebSocket server ready for connections`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;
