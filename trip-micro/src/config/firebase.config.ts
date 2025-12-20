import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FirebaseConfigService {
  private readonly logger = new Logger(FirebaseConfigService.name);
  private app: admin.app.App;

  constructor(private configService: ConfigService) {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    try {
      const credentialsPath = this.configService.get<string>(
        'FIREBASE_CREDENTIALS_PATH',
      );
      const databaseUrl = this.configService.get<string>(
        'FIREBASE_DATABASE_URL',
      );

      let credentials: any;

      if (credentialsPath) {
        // Load from file path
        const fullPath = path.resolve(credentialsPath);
        const certFile = fs.readFileSync(fullPath, 'utf-8');
        credentials = JSON.parse(certFile);
      } else {
        // Try to load from default location (trip-micro root directory)
        const defaultPath = path.resolve(process.cwd(), '..', 'cert.json');
        if (fs.existsSync(defaultPath)) {
          const certFile = fs.readFileSync(defaultPath, 'utf-8');
          credentials = JSON.parse(certFile);
        } else {
          throw new Error(
            'Firebase credentials not found. Please provide FIREBASE_CREDENTIALS_PATH or place cert.json in the project root.',
          );
        }
      }

      this.app = admin.initializeApp({
        credential: admin.credential.cert(credentials),
        databaseURL:
          databaseUrl || `https://${credentials.project_id}.firebaseio.com`,
      });

      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK', error);
      throw error;
    }
  }

  getApp(): admin.app.App {
    return this.app;
  }

  getDatabase(): admin.database.Database {
    return admin.database();
  }

  getAuth(): admin.auth.Auth {
    return admin.auth();
  }
}
