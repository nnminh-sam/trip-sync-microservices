import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

interface NotificationPayload {
  receiverId: string;
  title: string;
  message: string;
  priority: string;
  type: string;
}

@WebSocketGateway({
  cors: {
    origin: '*', // Configure this based on your frontend URL in production
    credentials: true,
  },
  namespace: 'notifications',
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  
  // Map to track connected users: userId -> socketId[]
  private userSockets = new Map<string, string[]>();
  
  // Map to track socket -> userId
  private socketToUser = new Map<string, string>();

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    
    // Send connection success message
    client.emit('connected', {
      message: 'Successfully connected to notification service',
      socketId: client.id,
    });
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketToUser.get(client.id);
    
    if (userId) {
      // Remove socket from user's socket list
      const userSocketList = this.userSockets.get(userId) || [];
      const updatedList = userSocketList.filter(id => id !== client.id);
      
      if (updatedList.length > 0) {
        this.userSockets.set(userId, updatedList);
      } else {
        this.userSockets.delete(userId);
      }
      
      this.socketToUser.delete(client.id);
      this.logger.log(`User ${userId} disconnected from socket ${client.id}`);
    }
    
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Subscribe a user to receive notifications
   * Client should emit 'subscribe' event with userId after connecting
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId } = data;
    
    if (!userId) {
      client.emit('error', { message: 'User ID is required for subscription' });
      return;
    }

    // Add socket to user's socket list
    const existingSockets = this.userSockets.get(userId) || [];
    if (!existingSockets.includes(client.id)) {
      existingSockets.push(client.id);
      this.userSockets.set(userId, existingSockets);
    }
    
    // Map socket to user
    this.socketToUser.set(client.id, userId);
    
    // Join a room named after the userId for easier broadcasting
    client.join(`user-${userId}`);
    
    this.logger.log(`User ${userId} subscribed with socket ${client.id}`);
    
    client.emit('subscribed', {
      message: 'Successfully subscribed to notifications',
      userId,
    });
  }

  /**
   * Unsubscribe a user from notifications
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(@ConnectedSocket() client: Socket) {
    const userId = this.socketToUser.get(client.id);
    
    if (userId) {
      // Remove from user room
      client.leave(`user-${userId}`);
      
      // Remove socket from user's socket list
      const userSocketList = this.userSockets.get(userId) || [];
      const updatedList = userSocketList.filter(id => id !== client.id);
      
      if (updatedList.length > 0) {
        this.userSockets.set(userId, updatedList);
      } else {
        this.userSockets.delete(userId);
      }
      
      this.socketToUser.delete(client.id);
      
      this.logger.log(`User ${userId} unsubscribed from socket ${client.id}`);
      
      client.emit('unsubscribed', {
        message: 'Successfully unsubscribed from notifications',
      });
    }
  }

  /**
   * Emit notification to a specific user
   * This method will be called by the NotificationService when a new notification is created
   */
  emitNotificationToUser(payload: NotificationPayload) {
    const { receiverId, title, message, priority, type } = payload;
    
    // Emit to all sockets connected for this user
    const userRoom = `user-${receiverId}`;
    
    this.server.to(userRoom).emit('new-notification', {
      receiverId,
      title,
      message,
      priority,
      type,
      timestamp: new Date().toISOString(),
    });
    
    const userSockets = this.userSockets.get(receiverId);
    if (userSockets && userSockets.length > 0) {
      this.logger.log(
        `Notification sent to user ${receiverId} on ${userSockets.length} socket(s)`,
      );
    } else {
      this.logger.warn(
        `User ${receiverId} is not connected, notification will be stored for later`,
      );
    }
  }

  /**
   * Broadcast notification to all connected clients
   * Useful for system-wide announcements
   */
  broadcastNotification(payload: Omit<NotificationPayload, 'receiverId'>) {
    const { title, message, priority, type } = payload;
    
    this.server.emit('broadcast-notification', {
      title,
      message,
      priority,
      type,
      timestamp: new Date().toISOString(),
    });
    
    this.logger.log('Broadcast notification sent to all connected clients');
  }

  /**
   * Get connection status for a user
   */
  isUserConnected(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return sockets !== undefined && sockets.length > 0;
  }

  /**
   * Get all connected users
   */
  getConnectedUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  /**
   * Get socket count for a user
   */
  getUserSocketCount(userId: string): number {
    const sockets = this.userSockets.get(userId);
    return sockets ? sockets.length : 0;
  }
}