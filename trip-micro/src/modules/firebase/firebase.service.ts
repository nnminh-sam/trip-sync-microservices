import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseConfigService } from '../../config/firebase.config';
import {
  SendNotificationDto,
  GetDataDto,
  UpdateDataDto,
  DeleteDataDto,
} from './dtos';
import { throwRpcException } from '../../utils';

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);
  private database: admin.database.Database;

  constructor(private firebaseConfig: FirebaseConfigService) {
    this.database = firebaseConfig.getDatabase();
  }

  /**
   * Send notification data to Firebase Realtime Database
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
