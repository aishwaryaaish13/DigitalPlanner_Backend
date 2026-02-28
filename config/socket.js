import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

// Initialize Socket.IO
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware (optional - allows connection without token)
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        console.log('Socket connection without authentication');
        socket.userId = 'anonymous';
        socket.userEmail = null;
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id || decoded.userId;
      socket.userEmail = decoded.email;
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      // Allow connection even if token is invalid
      socket.userId = 'anonymous';
      socket.userEmail = null;
      next();
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.id})`);
    
    // Join user-specific room
    socket.join(`user:${socket.userId}`);

    // Handle client events
    socket.on('subscribe:notifications', () => {
      console.log(`User ${socket.userId} subscribed to notifications`);
      socket.emit('notification', {
        type: 'info',
        message: 'Connected to real-time notifications',
        timestamp: new Date().toISOString()
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId} (${socket.id})`);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  console.log('Socket.IO initialized');
  return io;
};

// Get Socket.IO instance
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Notification helper functions
export const sendNotification = (userId, notification) => {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export const sendNotificationToAll = (notification) => {
  try {
    const io = getIO();
    io.emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error sending notification to all:', error);
  }
};

export const sendEventNotification = (userId, event, action) => {
  const messages = {
    created: `New event created: ${event.title}`,
    updated: `Event updated: ${event.title}`,
    deleted: `Event deleted: ${event.title}`,
    reminder: `Reminder: ${event.title} at ${event.time}`
  };

  sendNotification(userId, {
    type: 'event',
    action,
    message: messages[action] || 'Event notification',
    data: event
  });
};

export const sendTaskNotification = (userId, task, action) => {
  const messages = {
    created: `New task created: ${task.title}`,
    updated: `Task updated: ${task.title}`,
    completed: `Task completed: ${task.title}`,
    deleted: `Task deleted: ${task.title}`
  };

  sendNotification(userId, {
    type: 'task',
    action,
    message: messages[action] || 'Task notification',
    data: task
  });
};

export const sendGoalNotification = (userId, goal, action) => {
  const messages = {
    created: `New goal created: ${goal.title}`,
    updated: `Goal updated: ${goal.title}`,
    completed: `Goal completed: ${goal.title}`,
    deleted: `Goal deleted: ${goal.title}`
  };

  sendNotification(userId, {
    type: 'goal',
    action,
    message: messages[action] || 'Goal notification',
    data: goal
  });
};
