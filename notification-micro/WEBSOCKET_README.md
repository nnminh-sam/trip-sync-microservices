# WebSocket Notification Service

## Overview
The notification microservice now includes real-time WebSocket support for pushing notifications to connected clients. When a new notification is created, it will automatically be emitted to the target user if they are connected.

## Features
- Real-time notification delivery via WebSocket
- Support for multiple connections per user
- Automatic reconnection handling
- Room-based notification routing
- Broadcast notifications for system-wide messages

## WebSocket Events

### Client -> Server Events

#### `subscribe`
Subscribe a user to receive notifications.
```javascript
socket.emit('subscribe', { userId: 'user-123' });
```

#### `unsubscribe`
Unsubscribe from notifications.
```javascript
socket.emit('unsubscribe');
```

### Server -> Client Events

#### `connected`
Emitted when client successfully connects.
```javascript
socket.on('connected', (data) => {
  console.log(data.message); // "Successfully connected to notification service"
  console.log(data.socketId); // Socket ID
});
```

#### `subscribed`
Emitted when user successfully subscribes.
```javascript
socket.on('subscribed', (data) => {
  console.log(data.message); // "Successfully subscribed to notifications"
  console.log(data.userId); // User ID
});
```

#### `new-notification`
Emitted when a new notification is created for the user.
```javascript
socket.on('new-notification', (data) => {
  console.log(data.receiverId); // Target user ID
  console.log(data.title);      // Notification title
  console.log(data.message);    // Notification message
  console.log(data.priority);   // Priority: low, medium, high
  console.log(data.type);       // Type: trip_approval, task_update, system, reminder
  console.log(data.timestamp);  // ISO timestamp
});
```

#### `broadcast-notification`
Emitted for system-wide notifications.
```javascript
socket.on('broadcast-notification', (data) => {
  console.log(data.title);
  console.log(data.message);
  console.log(data.priority);
  console.log(data.type);
  console.log(data.timestamp);
});
```

## Implementation

### Server Configuration
The WebSocket server runs on the same port as the notification microservice (default: 3003).

- WebSocket URL: `ws://localhost:3003/notifications`
- Namespace: `/notifications`
- Transport: WebSocket (with Socket.IO)

### Client Implementation Example

#### JavaScript/Browser
```javascript
// Connect to WebSocket server
const socket = io('http://localhost:3003/notifications', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Handle connection
socket.on('connect', () => {
  console.log('Connected to notification service');
  
  // Subscribe with user ID
  socket.emit('subscribe', { userId: 'user-123' });
});

// Handle new notifications
socket.on('new-notification', (notification) => {
  console.log('New notification:', notification);
  // Display notification to user
  showNotification(notification);
});

// Handle disconnection
socket.on('disconnect', () => {
  console.log('Disconnected from notification service');
});
```

#### React Example
```jsx
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const newSocket = io('http://localhost:3003/notifications', {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      newSocket.emit('subscribe', { userId });
    });

    newSocket.on('new-notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('unsubscribe');
      newSocket.close();
    };
  }, [userId]);

  return { notifications, socket };
}
```

## Testing

### Using the Test Client
1. Open `test-websocket.html` in a browser
2. Enter a User ID
3. Click "Connect"
4. Send test notifications using the form

### Manual Testing with cURL
Create a notification via the API Gateway:
```bash
curl -X POST http://localhost:3000/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "user_id": "user-123",
    "title": "Test Notification",
    "message": "This is a test message",
    "priority": "medium",
    "type": "task_update"
  }'
```

### Testing with Multiple Clients
1. Open multiple browser tabs with the test client
2. Connect with the same User ID in multiple tabs
3. Send a notification - all tabs should receive it

## Integration with Other Services

When other microservices need to send notifications, they should call the notification service through NATS:

```javascript
// In another microservice
await this.natsClient.send('notification.create', {
  request: {
    body: {
      user_id: 'user-123',
      title: 'Trip Approved',
      message: 'Your trip has been approved',
      priority: 'high',
      type: 'trip_approval'
    }
  }
}).toPromise();
```

The notification will be:
1. Stored in the database
2. Automatically emitted via WebSocket to the connected user

## Security Considerations

### Production Configuration
1. **CORS**: Update CORS settings in `main.ts` and `notification.gateway.ts` to restrict origins
2. **Authentication**: Implement JWT validation for WebSocket connections
3. **Rate Limiting**: Add rate limiting to prevent spam
4. **SSL/TLS**: Use WSS (WebSocket Secure) in production

### Example Secure Configuration
```typescript
@WebSocketGateway({
  cors: {
    origin: ['https://your-frontend.com'],
    credentials: true,
  },
  namespace: 'notifications',
})
```

## Monitoring

The gateway provides methods to monitor connections:

```typescript
// Check if a user is connected
const isConnected = notificationGateway.isUserConnected('user-123');

// Get all connected users
const connectedUsers = notificationGateway.getConnectedUsers();

// Get socket count for a user
const socketCount = notificationGateway.getUserSocketCount('user-123');
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure the notification microservice is running on port 3003
   - Check firewall settings

2. **Notifications Not Received**
   - Verify the user is subscribed with correct userId
   - Check browser console for errors
   - Ensure the notification service has database connection

3. **CORS Errors**
   - Update CORS settings in `main.ts` and gateway
   - Ensure credentials are included in client connection

### Debug Logging
Enable debug logs by setting environment variable:
```bash
DEBUG=socket.io:* npm run start:dev
```

## Performance Considerations

- Each user can have multiple socket connections (multiple devices/tabs)
- Notifications are sent to all connected sockets for a user
- Use rooms for efficient message routing
- Consider implementing message queuing for offline users

## Future Enhancements

- [ ] Add authentication/authorization for WebSocket connections
- [ ] Implement message acknowledgment
- [ ] Add message history/replay for reconnections
- [ ] Support for notification preferences
- [ ] Push notification integration (FCM/APNS)
- [ ] Email fallback for offline users
- [ ] Notification templates
- [ ] Scheduled notifications
- [ ] Notification analytics