import { Injectable, Logger, HttpStatus, Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { FirebaseConfigService } from '../../config/firebase.config';
import {
  SendNotificationDto,
  GetDataDto,
  UpdateDataDto,
  DeleteDataDto,
} from './dtos';
import { throwRpcException, NatsClientSender } from '../../utils';
import { GoogleAuth } from 'google-auth-library';
import { ClientProxy } from '@nestjs/microservices';
import { NATSClient } from '../../client/clients';
import { MessagePayloadDto } from '../../dtos/message-payload.dto';
import { TokenClaimsDto } from '../../dtos/token-claims.dto';

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);
  private database: admin.database.Database;
  private auth: GoogleAuth;
  private readonly userSender: NatsClientSender<{ findById: string }>;

  constructor(
    private firebaseConfig: FirebaseConfigService,
    @Inject(NATSClient.name)
    private readonly natsClient: ClientProxy,
  ) {
    this.database = firebaseConfig.getDatabase();
    this.auth = new GoogleAuth({
      keyFile: 'cert.json',
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });
    this.userSender = new NatsClientSender(this.natsClient, {
      findById: 'user.find.one.id',
    });
  }

  async getAccessToken() {
    const client = await this.auth.getClient();
    const accessTokenResponse = await client.getAccessToken();
    return accessTokenResponse.token;
  }

  /**
   * Extract userId from notification path
   * Path format: /noti/{userId}/{timestamp}
   * @param path Notification path
   * @returns string User ID or null
   */
  private extractUserIdFromPath(path: string): string | null {
    const pathParts = path.split('/');
    if (pathParts.length >= 3 && pathParts[1] === 'noti') {
      return pathParts[2];
    }
    return null;
  }

  /**
   * Send FCM notification to a specific user
   * @param userId User ID to send notification to
   * @param title Notification title
   * @param message Notification message
   * @param claims Token claims for user service call
   * @param data Additional data to include in notification
   */
  private async sendFCMNotification(
    userId: string,
    title: string,
    message: string,
    claims: TokenClaimsDto,
    data?: Record<string, any>,
  ): Promise<void> {
    console.log('🚀 ~ FirebaseService ~ sendFCMNotification ~ userId:', userId);
    try {
      const serverKey = this.firebaseConfig.getServerKey();
      console.log(
        '🚀 ~ FirebaseService ~ sendFCMNotification ~ serverKey:',
        serverKey,
      );
      if (!serverKey) {
        this.logger.warn(
          `FCM_SERVER_KEY not configured. Skipping push notification for user ${userId}`,
        );
        return;
      }

      let deviceToken: string;

      try {
        const payload: MessagePayloadDto = {
          request: {
            path: {
              id: userId,
            },
          },
        };

        const user: any = await this.userSender.send({
          messagePattern: 'findById',
          payload,
        });
        console.log('🚀 ~ FirebaseService ~ sendFCMNotification ~ user:', user);

        deviceToken = user?.deviceToken;

        if (!deviceToken) {
          this.logger.warn(
            `Device token not found for user ${userId}. Skipping FCM notification.`,
          );
          return;
        }
      } catch (error) {
        this.logger.error(
          `Failed to fetch device token for user ${userId}: ${error.message}`,
        );
        return;
      }

      const fcmPayload = {
        token: deviceToken,
        // token:
        //   'cyDJLfKzTHq3u3k0VGrSq7:APA91bGCO2FN_0FXmHKqCg7N8YcARST0bUwHEThZN1eIbRKXj9chaFVMRIQjnkLlBB1W2qlg5PPRP37GlBD-boJeXxDVXCz4tPrxFIn-j3C8rF-i988G9fY',
        notification: {
          title,
          body: message,
          image:
            'https://storage.googleapis.com/proof-media/z7355405043313_bcc87cc6b8a3b1767ff809a75824ccb1.jpg',
        },
        data: {
          receiverId: userId,
          timestamp: new Date().getTime().toString(),
          ...(data && data),
        },
        android: {
          priority: 'high',
        },
      };

      const response = await axios.post(
        'https://fcm.googleapis.com/v1/projects/tripsyncgrad/messages:send',
        { message: fcmPayload },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await this.getAccessToken()}`,
          },
          timeout: 5000,
        },
      );

      this.logger.log(
        `FCM push notification sent successfully to user ${userId}. Response: ${response.status}`,
      );
    } catch (error) {
      console.log('🚀 ~ FirebaseService ~ sendFCMNotification ~ error:', error);
      // Log FCM error but don't throw - notification in DB is primary channel
      this.logger.warn(
        `Failed to send FCM push notification to user ${userId}: ${error.message}`,
      );
    }
  }

  /**
   * Send notification data to Firebase Realtime Database and FCM
   * @param payload SendNotificationDto containing path and notification data
   * @returns Promise<any> Firebase response
   */
  async sendNotification(payload: SendNotificationDto): Promise<any> {
    try {
      this.logger.log(
        `Sending notification to path: ${payload.path}`,
        payload.description || '',
      );

      const ref = this.database.ref(payload.path);
      await ref.set({
        ...payload.data,
        ...(!payload.data?.is_read && { is_read: false }),
        timestamp: admin.database.ServerValue.TIMESTAMP,
      });

      this.logger.log(`Notification sent successfully to ${payload.path}`);

      // Send FCM notification in addition to database notification
      // const userId = this.extractUserIdFromPath(payload.path);
      const userId = payload.data?.receiverId;
      console.log('🚀 ~ FirebaseService ~ sendNotification ~ userId:', userId);
      if (
        userId &&
        payload.data?.title &&
        payload.data?.message &&
        payload.claims
      ) {
        await this.sendFCMNotification(
          userId,
          payload.data.title,
          payload.data.message,
          payload.claims,
          {
            senderId: payload.data.senderId,
            receiverId: payload.data.receiverId,
          },
        );
      }

      return {
        success: true,
        message: 'Notification sent successfully',
        path: payload.path,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send notification to ${payload.path}`,
        error,
      );
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to send notification: ${error.message}`,
      });
    }
  }

  /**
   * Send data to Firebase Realtime Database
   * @param path Database path
   * @param data Data to send
   * @returns Promise<any> Firebase response
   */
  async sendData(path: string, data: Record<string, any>): Promise<any> {
    try {
      this.logger.log(`Sending data to path: ${path}`);

      const ref = this.database.ref(path);
      await ref.set({
        ...data,
        timestamp: admin.database.ServerValue.TIMESTAMP,
      });

      this.logger.log(`Data sent successfully to ${path}`);

      return {
        success: true,
        message: 'Data sent successfully',
        path,
      };
    } catch (error) {
      this.logger.error(`Failed to send data to ${path}`, error);
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to send data: ${error.message}`,
      });
    }
  }

  /**
   * Get data from Firebase Realtime Database
   * @param payload GetDataDto containing path
   * @returns Promise<any> Data from database
   */
  async getData(payload: GetDataDto): Promise<any> {
    try {
      this.logger.log(`Retrieving data from path: ${payload.path}`);

      const ref = this.database.ref(payload.path);
      const snapshot = await ref.get();

      if (!snapshot.exists()) {
        return {
          success: true,
          data: null,
          message: 'No data found at path',
          path: payload.path,
        };
      }

      this.logger.log(`Data retrieved successfully from ${payload.path}`);

      return {
        success: true,
        data: snapshot.val(),
        path: payload.path,
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve data from ${payload.path}`, error);
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to retrieve data: ${error.message}`,
      });
    }
  }

  /**
   * Update data in Firebase Realtime Database
   * @param payload UpdateDataDto containing path and data
   * @returns Promise<any> Firebase response
   */
  async updateData(payload: UpdateDataDto): Promise<any> {
    try {
      this.logger.log(`Updating data at path: ${payload.path}`);

      const ref = this.database.ref(payload.path);
      await ref.update({
        ...payload.data,
        updatedAt: admin.database.ServerValue.TIMESTAMP,
      });

      this.logger.log(`Data updated successfully at ${payload.path}`);

      return {
        success: true,
        message: 'Data updated successfully',
        path: payload.path,
      };
    } catch (error) {
      this.logger.error(`Failed to update data at ${payload.path}`, error);
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to update data: ${error.message}`,
      });
    }
  }

  /**
   * Delete data from Firebase Realtime Database
   * @param payload DeleteDataDto containing path
   * @returns Promise<any> Firebase response
   */
  async deleteData(payload: DeleteDataDto): Promise<any> {
    try {
      this.logger.log(`Deleting data at path: ${payload.path}`);

      const ref = this.database.ref(payload.path);
      await ref.remove();

      this.logger.log(`Data deleted successfully from ${payload.path}`);

      return {
        success: true,
        message: 'Data deleted successfully',
        path: payload.path,
      };
    } catch (error) {
      this.logger.error(`Failed to delete data at ${payload.path}`, error);
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to delete data: ${error.message}`,
      });
    }
  }

  /**
   * Add data to a collection (push operation)
   * @param path Database path
   * @param data Data to push
   * @returns Promise<string> New key/ID
   */
  async pushData(path: string, data: Record<string, any>): Promise<string> {
    try {
      this.logger.log(`Pushing data to path: ${path}`);

      const ref = this.database.ref(path);
      const newRef = await ref.push({
        ...data,
        timestamp: admin.database.ServerValue.TIMESTAMP,
      });

      this.logger.log(
        `Data pushed successfully to ${path} with key: ${newRef.key}`,
      );

      return newRef.key;
    } catch (error) {
      this.logger.error(`Failed to push data to ${path}`, error);
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to push data: ${error.message}`,
      });
    }
  }
}
