import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as admin from "firebase-admin";
import { EnvSchema } from "src/config";
import { GpsLogService } from "src/modules/gps-log/gps-log.service";

type FirebaseEvent = "child_added" | "child_changed";
type FirebaseConnectionState = "disconnected" | "connected" | "reconnecting";

@Injectable()
export class FirebaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FirebaseService.name);
  private database: admin.database.Database | null = null;
  private gpsRef: admin.database.Reference | null = null;
  private databaseUrl: string | null = null;
  private connectionState: FirebaseConnectionState = "disconnected";
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly reconnectDelayMs = 5000; // 5 seconds
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isShuttingDown = false;
  private readonly eventHandlers: Map<
    FirebaseEvent,
    (snapshot: admin.database.DataSnapshot) => Promise<void>
  > = new Map();

  constructor(
    private readonly configService: ConfigService<EnvSchema>,
    private readonly gpsLogService: GpsLogService
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.initFirebase();
      if (this.database) {
        this.setupConnectionMonitoring();
        this.startListeners();
      }
    } catch (error) {
      this.logger.error(
        "Failed to initialize Firebase service",
        (error as Error).stack
      );
      // Attempt reconnection
      this.scheduleReconnect();
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.isShuttingDown = true;
    this.logger.log("Shutting down Firebase service...");

    // Clear any pending reconnection attempts
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Remove all listeners
    if (this.gpsRef) {
      try {
        this.gpsRef.off();
        this.logger.log("Firebase listeners removed");
      } catch (error) {
        this.logger.warn(
          "Error removing Firebase listeners",
          (error as Error).stack
        );
      }
    }

    // Close database connection
    if (this.database) {
      try {
        await this.database.goOffline();
        this.logger.log("Firebase database connection closed");
      } catch (error) {
        this.logger.warn(
          "Error closing Firebase database connection",
          (error as Error).stack
        );
      }
    }

    this.logger.log("Firebase service shutdown complete");
  }

  private async initFirebase(): Promise<void> {
    const certPath = this.configService.get<string>("FIREBASE_CERT_PATH");
    const firebaseDatabaseUrl = this.configService.get<string>(
      "FIREBASE_DATABASE_URL"
    );

    if (!certPath || !firebaseDatabaseUrl) {
      const missingVars = [];
      if (!certPath) missingVars.push("FIREBASE_CERT_PATH");
      if (!firebaseDatabaseUrl) missingVars.push("FIREBASE_DATABASE_URL");
      throw new Error(
        `Firebase environment variables are missing: ${missingVars.join(", ")}`
      );
    }

    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(certPath),
          databaseURL: firebaseDatabaseUrl,
        });
        this.logger.log("Firebase Admin SDK initialized successfully");
      } else {
        this.logger.log("Firebase Admin SDK already initialized");
      }

      this.database = admin.database();
      this.databaseUrl = firebaseDatabaseUrl;
      this.connectionState = "connected";
      this.reconnectAttempts = 0;
      this.logger.log(
        `Connected to Firebase Realtime Database: ${firebaseDatabaseUrl}`
      );
    } catch (error) {
      this.connectionState = "disconnected";
      const err = error as Error;
      this.logger.error(
        `Failed to initialize Firebase: ${err.message}`,
        err.stack
      );
      throw err;
    }
  }

  private setupConnectionMonitoring(): void {
    if (!this.database) return;

    const connectedRef = this.database.ref(".info/connected");
    connectedRef.on("value", (snapshot) => {
      const isConnected = snapshot.val() === true;
      const previousState = this.connectionState;

      if (isConnected) {
        this.connectionState = "connected";
        this.reconnectAttempts = 0;
        if (previousState !== "connected") {
          this.logger.log("Firebase connection restored");
          // Re-register listeners if they were lost
          if (!this.gpsRef || !this.eventHandlers.size) {
            this.startListeners();
          }
        }
      } else {
        this.connectionState = "disconnected";
        if (previousState === "connected") {
          this.logger.warn("Firebase connection lost");
          if (!this.isShuttingDown) {
            this.scheduleReconnect();
          }
        }
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.isShuttingDown) return;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error(
        `Max reconnection attempts (${this.maxReconnectAttempts}) reached. Stopping reconnection attempts.`
      );
      return;
    }

    this.connectionState = "reconnecting";
    this.reconnectAttempts++;
    const delay = this.reconnectDelayMs * this.reconnectAttempts; // Exponential backoff

    this.logger.log(
      `Scheduling Firebase reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`
    );

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.initFirebase();
        if (this.database) {
          this.setupConnectionMonitoring();
          this.startListeners();
        }
      } catch (error) {
        this.logger.error(
          `Reconnection attempt ${this.reconnectAttempts} failed`,
          (error as Error).stack
        );
        this.scheduleReconnect();
      }
    }, delay);
  }

  private startListeners(): void {
    if (!this.database) {
      this.logger.error(
        "Cannot start listeners: Firebase database not initialized"
      );
      return;
    }

    if (this.isShuttingDown) {
      this.logger.warn("Skipping listener setup: service is shutting down");
      return;
    }

    try {
      this.gpsRef = this.database.ref("/gps");
      this.registerListener("child_added");
      this.registerListener("child_changed");
      this.logger.log("Firebase listeners registered for /gps path");
    } catch (error) {
      this.logger.error(
        "Failed to start Firebase listeners",
        (error as Error).stack
      );
      throw error;
    }
  }

  private registerListener(event: FirebaseEvent): void {
    if (!this.gpsRef) {
      this.logger.error(
        `Cannot register ${event} listener: GPS reference is null`
      );
      return;
    }

    const handler = async (snapshot: admin.database.DataSnapshot) => {
      if (this.isShuttingDown) {
        this.logger.debug(`Skipping ${event} event: service is shutting down`);
        return;
      }

      try {
        await this.handleSnapshot(snapshot, event);
      } catch (error) {
        const err = error as Error;
        this.logger.error(
          `Error handling Firebase ${event} event: ${err.message}`,
          err.stack
        );
        // Log the snapshot key for debugging
        this.logger.debug(`Failed snapshot key: ${snapshot.key}`);
      }
    };

    // Store handler for potential cleanup
    this.eventHandlers.set(event, handler);

    this.gpsRef.on(event, handler, (error) => {
      const err = error as Error;
      this.logger.error(
        `Firebase listener error on ${event}: ${err.message}`,
        err.stack
      );
      // Attempt to re-register listener on error
      if (!this.isShuttingDown && this.connectionState === "connected") {
        this.logger.log(`Attempting to re-register ${event} listener`);
        setTimeout(() => {
          if (!this.isShuttingDown && this.gpsRef) {
            this.registerListener(event);
          }
        }, 2000);
      }
    });
  }

  private async handleSnapshot(
    snapshot: admin.database.DataSnapshot,
    event: FirebaseEvent
  ): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    const value = snapshot.val();
    const rawPath = this.extractPath(snapshot);
    const snapshotKey = snapshot.key;

    if (!rawPath) {
      this.logger.warn(
        `Skipping ${event} event for key "${snapshotKey}": missing path information`
      );
      return;
    }

    if (!value) {
      this.logger.debug(
        `Skipping ${event} event for key "${snapshotKey}": null or undefined value`
      );
      return;
    }

    try {
      // Process the snapshot, which may contain nested data
      await this.processSnapshotRecursively(rawPath, value, event);
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to process ${event} event for path ${rawPath}: ${err.message}`,
        err.stack
      );
      // Don't re-throw - continue processing other data
    }
  }

  private async processSnapshotRecursively(
    currentPath: string,
    data: any,
    event: FirebaseEvent,
    depth: number = 0
  ): Promise<void> {
    if (!data || typeof data !== "object") {
      return;
    }

    // Check if this is a GPS data point (has lat/long)
    if (this.isGpsDataPoint(data)) {
      try {
        const result = await this.gpsLogService.saveFromFirebase(
          currentPath,
          data
        );
        if (result) {
          this.logger.debug(
            `Successfully processed ${event} event for path: ${currentPath}`
          );
        } else {
          this.logger.debug(
            `GPS log save returned null for path: ${currentPath}`
          );
        }
      } catch (error) {
        const err = error as Error;
        this.logger.debug(
          `Skipping GPS point at ${currentPath}: ${err.message}`
        );
      }
      return;
    }

    // If not a GPS point, check if it's a nested object and recurse
    if (typeof data === "object" && !Array.isArray(data)) {
      const keys = Object.keys(data);

      // Limit recursion depth to prevent infinite loops
      if (depth < 10 && keys.length > 0) {
        for (const key of keys) {
          const nestedPath = `${currentPath}/${key}`;
          await this.processSnapshotRecursively(
            nestedPath,
            data[key],
            event,
            depth + 1
          );
        }
      }
    }
  }

  private isGpsDataPoint(data: any): boolean {
    if (!data || typeof data !== "object") {
      return false;
    }
    // GPS data should have lat or latitude, and long or longitude
    return (
      ("lat" in data || "latitude" in data) &&
      ("long" in data || "longitude" in data)
    );
  }

  private extractPath(snapshot: admin.database.DataSnapshot): string | null {
    if (!this.databaseUrl) {
      this.logger.warn("Cannot extract path: database URL not set");
      return null;
    }

    try {
      const refUrl = snapshot.ref.toString();

      if (!refUrl.startsWith(this.databaseUrl)) {
        this.logger.warn(
          `Reference URL does not match database URL. Ref: ${refUrl}, DB: ${this.databaseUrl}`
        );
        return null;
      }

      return refUrl.replace(this.databaseUrl, "");
    } catch (error) {
      this.logger.error(
        "Error extracting path from snapshot",
        (error as Error).stack
      );
      return null;
    }
  }

  async fetchGpsData(
    userId: string,
    tripId: string
  ): Promise<Record<string, { lat: number; long: number }> | null> {
    if (!this.database) {
      this.logger.error("Firebase database not initialized");
      throw new Error("Firebase database not initialized");
    }

    if (!userId || !tripId) {
      this.logger.warn("Invalid parameters: userId and tripId are required");
      throw new Error("userId and tripId are required");
    }

    try {
      const gpsPath = `/gps/${userId}/${tripId}`;
      const snapshot = await this.database.ref(gpsPath).get();

      if (!snapshot.exists()) {
        this.logger.debug(`No GPS data found for path: ${gpsPath}`);
        return null;
      }

      const data = snapshot.val();
      this.logger.debug(`Successfully fetched GPS data from path: ${gpsPath}`);

      return data as Record<string, { lat: number; long: number }>;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error fetching GPS data for userId: ${userId}, tripId: ${tripId} - ${err.message}`,
        err.stack
      );
      throw err;
    }
  }

  async fetchGpsDataByTimestampRange(
    userId: string,
    tripId: string,
    startTimestamp?: number,
    endTimestamp?: number
  ): Promise<Record<string, { lat: number; long: number }> | null> {
    if (!this.database) {
      this.logger.error("Firebase database not initialized");
      throw new Error("Firebase database not initialized");
    }

    if (!userId || !tripId) {
      this.logger.warn("Invalid parameters: userId and tripId are required");
      throw new Error("userId and tripId are required");
    }

    try {
      const gpsPath = `/gps/${userId}/${tripId}`;
      const ref = this.database.ref(gpsPath);

      let query: admin.database.Query;
      if (startTimestamp && endTimestamp) {
        query = ref
          .orderByKey()
          .startAt(startTimestamp.toString())
          .endAt(endTimestamp.toString());
      } else {
        query = ref;
      }

      const snapshot = await query.get();

      if (!snapshot.exists()) {
        this.logger.debug(
          `No GPS data found for path: ${gpsPath} with timestamp range ${startTimestamp} - ${endTimestamp}`
        );
        return null;
      }

      const data = snapshot.val();
      this.logger.debug(
        `Successfully fetched GPS data from path: ${gpsPath} with timestamp range`
      );

      return data as Record<string, { lat: number; long: number }>;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error fetching GPS data with timestamp range for userId: ${userId}, tripId: ${tripId} - ${err.message}`,
        err.stack
      );
      throw err;
    }
  }
}
