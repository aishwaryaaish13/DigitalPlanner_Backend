# WebSocket Real-Time Notifications Setup

## Backend Setup

### 1. Database Setup
Run the SQL queries in Supabase SQL Editor:
```sql
-- Run supabase_notifications_table.sql
```

### 2. Server Configuration
The WebSocket server is already integrated with your Express server using Socket.IO.

## Frontend Integration

### 1. Install Socket.IO Client
```bash
npm install socket.io-client
```

### 2. Create WebSocket Service

Create `src/services/socketService.js`:

```javascript
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io('http://localhost:5000', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.socket.emit('subscribe:notifications');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    this.socket.on('notification', (notification) => {
      console.log('Notification received:', notification);
      this.notifyListeners('notification', notification);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }
}

export default new SocketService();
```

### 3. Create Notification Context

Create `src/context/NotificationContext.jsx`:

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import socketService from '../services/socketService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      socketService.connect(token);

      const handleNotification = (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification if permitted
        if (Notification.permission === 'granted') {
          new Notification(notification.message, {
            body: notification.data?.description || '',
            icon: '/logo.png'
          });
        }
      };

      socketService.on('notification', handleNotification);

      return () => {
        socketService.off('notification', handleNotification);
        socketService.disconnect();
      };
    }
  }, []);

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        clearNotifications,
        markAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
```

### 4. Create Notification Component

Create `src/components/notifications/NotificationBell.jsx`:

```javascript
import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';

export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-muted rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-80 bg-card border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
          >
            <div className="p-4 border-b">
              <h3 className="font-semibold">Notifications</h3>
            </div>
            <div className="divide-y">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id || notification.timestamp}
                    onClick={() => markAsRead(notification.id)}
                    className={`p-4 hover:bg-muted cursor-pointer ${
                      !notification.is_read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <p className="text-sm font-medium">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No notifications
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
```

### 5. Integrate in Your App

Update `src/App.jsx`:

```javascript
import { NotificationProvider } from './context/NotificationContext';
import { NotificationBell } from './components/notifications/NotificationBell';

function App() {
  return (
    <NotificationProvider>
      <div className="app">
        {/* Add NotificationBell to your header/navbar */}
        <NotificationBell />
        
        {/* Rest of your app */}
      </div>
    </NotificationProvider>
  );
}
```

### 6. Request Browser Notification Permission

Add this to your login success handler:

```javascript
// After successful login
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}
```

## API Endpoints

### Get Notifications
```
GET /api/notifications?limit=50&unread_only=false
```

### Mark as Read
```
PUT /api/notifications/:id/read
```

### Mark All as Read
```
PUT /api/notifications/read-all
```

### Delete Notification
```
DELETE /api/notifications/:id
```

## Notification Types

The system supports these notification types:
- `event` - Calendar event notifications
- `task` - Task notifications
- `goal` - Goal notifications
- `habit` - Habit notifications
- `journal` - Journal notifications
- `mood` - Mood tracking notifications
- `info` - General information
- `success` - Success messages
- `warning` - Warning messages
- `error` - Error messages

## Testing

1. Start your backend server
2. Login to your frontend app
3. Create/update/delete events, tasks, or goals
4. You should see real-time notifications appear instantly

## Troubleshooting

### Connection Issues
- Check if backend server is running
- Verify JWT token is valid
- Check browser console for errors
- Ensure CORS is properly configured

### Notifications Not Appearing
- Check if WebSocket connection is established
- Verify user is authenticated
- Check browser console for Socket.IO errors
- Ensure notification permissions are granted

### Performance
- Limit notification history (default: 50)
- Clear old notifications periodically
- Use pagination for notification list
