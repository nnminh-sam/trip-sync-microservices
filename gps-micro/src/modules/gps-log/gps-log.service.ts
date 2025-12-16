import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { IsNull, Repository, DataSource, QueryRunner } from "typeorm";
import { GpsLog } from "src/models/gps-log.model";

export interface ParsedPath {
  userId: string;
  tripId: string | null;
  timestampSource?: string | number;
}

export interface FirebaseGpsPayload {
  userId: string;
  tripId: string | null;
  latitude: number;
  longitude: number;
  timestamp: Date;
  rawPath: string;
}

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
}

@Injectable()
export class GpsLogService {
  private readonly logger = new Logger(GpsLogService.name);
  private readonly defaultRetryOptions: RetryOptions = {
    maxAttempts: 3,
    delayMs: 1000,
  };

  constructor(
    @InjectRepository(GpsLog)
    private readonly gpsLogRepository: Repository<GpsLog>,
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {}

  async saveFromFirebase(
    rawPath: string,
    data: unknown
  ): Promise<GpsLog | null> {
    return this.executeWithRetry(
      async () => {
        const parsed = this.parseFirebasePayload(rawPath, data);
        return this.saveGpsLog(parsed);
      },
      {
        context: `saveFromFirebase for path: ${rawPath}`,
        retryOptions: this.defaultRetryOptions,
      }
    );
  }

  private async saveGpsLog(parsed: FirebaseGpsPayload): Promise<GpsLog> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const locationPoint = this.createLocationPoint(
        parsed.latitude,
        parsed.longitude
      );

      const existing = await this.findExistingRecord(
        parsed.userId,
        parsed.tripId,
        parsed.timestamp,
        queryRunner
      );

      let entity: GpsLog;

      if (existing) {
        // Update existing record
        entity = queryRunner.manager.merge(GpsLog, existing, {
          latitude: parsed.latitude,
          longitude: parsed.longitude,
          timestamp: parsed.timestamp,
          tripId: parsed.tripId,
          locationPoint,
        });
      } else {
        // Create new record
        entity = queryRunner.manager.create(GpsLog, {
          userId: parsed.userId,
          tripId: parsed.tripId,
          latitude: parsed.latitude,
          longitude: parsed.longitude,
          timestamp: parsed.timestamp,
          locationPoint,
        });
      }

      const saved = await queryRunner.manager.save(GpsLog, entity);
      await queryRunner.commitTransaction();

      this.logger.debug(
        `GPS log ${existing ? "updated" : "created"} successfully: userId=${parsed.userId}, tripId=${parsed.tripId || "null"}, timestamp=${parsed.timestamp.toISOString()}`
      );

      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const err = error as Error;
      this.logger.error(
        `Database transaction failed for GPS log: ${err.message}`,
        err.stack
      );
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  parseFirebasePayload(rawPath: string, data: unknown): FirebaseGpsPayload {
    try {
      const { userId, tripId, timestampSource } = this.parsePath(rawPath);
      const payload = this.ensureObject(data);

      // Firebase uses 'lat' and 'long', but support both naming conventions
      const latValue = payload.lat ?? payload.latitude;
      const longValue = payload.long ?? payload.longitude;

      // Check if coordinates exist before parsing
      if (latValue === undefined || latValue === null) {
        throw new Error(
          `Missing latitude (lat) in payload. Available keys: ${Object.keys(payload).join(", ")}`
        );
      }
      if (longValue === undefined || longValue === null) {
        throw new Error(
          `Missing longitude (long) in payload. Available keys: ${Object.keys(payload).join(", ")}`
        );
      }

      const latitude = this.parseNumber(latValue, "latitude", rawPath);
      const longitude = this.parseNumber(longValue, "longitude", rawPath);
      const timestamp = this.parseTimestamp(
        timestampSource ?? payload.timestamp ?? Date.now()
      );

      this.validateGpsData(latitude, longitude, timestamp);

      return {
        userId,
        tripId,
        latitude,
        longitude,
        timestamp,
        rawPath,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to parse Firebase payload from path ${rawPath}: ${err.message}`,
        err.stack
      );
      throw new Error(`Invalid Firebase payload: ${err.message}`);
    }
  }

  parsePath(rawPath: string): ParsedPath {
    if (!rawPath || typeof rawPath !== "string") {
      throw new Error(`Invalid path: path must be a non-empty string`);
    }

    try {
      const cleaned = rawPath
        .replace(/^https?:\/\/[^/]+/, "")
        .replace(/^\/+/, "");
      const segments = cleaned.split("/").filter(Boolean);

      if (segments.length === 0) {
        throw new Error(`Invalid Firebase path: empty path after cleaning`);
      }

      // Remove 'gps' prefix if present
      if (segments[0] === "gps") {
        segments.shift();
      }

      if (segments.length < 1) {
        throw new Error(
          `Invalid Firebase path: insufficient segments in ${rawPath}`
        );
      }

      const userId = segments[0];
      if (!userId || userId.trim().length === 0) {
        throw new Error(`Invalid Firebase path: empty userId in ${rawPath}`);
      }

      let tripId: string | null = null;
      let timestampSource: string | number | undefined;

      if (segments.length >= 3) {
        tripId = segments[1];
        timestampSource = segments[2];
      } else if (segments.length === 2) {
        tripId = null;
        timestampSource = segments[1];
      }

      return { userId, tripId, timestampSource };
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Path parsing failed for "${rawPath}": ${err.message}`,
        err.stack
      );
      throw err;
    }
  }

  validateGpsData(latitude: number, longitude: number, timestamp: Date): void {
    const errors: string[] = [];

    if (!Number.isFinite(latitude)) {
      errors.push(`Latitude is not a finite number: ${latitude}`);
    } else if (latitude < -90 || latitude > 90) {
      errors.push(`Latitude out of range [-90, 90]: ${latitude}`);
    }

    if (!Number.isFinite(longitude)) {
      errors.push(`Longitude is not a finite number: ${longitude}`);
    } else if (longitude < -180 || longitude > 180) {
      errors.push(`Longitude out of range [-180, 180]: ${longitude}`);
    }

    if (!(timestamp instanceof Date)) {
      errors.push(`Timestamp is not a Date instance: ${typeof timestamp}`);
    } else if (isNaN(+timestamp)) {
      errors.push(`Timestamp is invalid: ${timestamp}`);
    }

    if (errors.length > 0) {
      const errorMessage = `Invalid GPS data payload: ${errors.join("; ")}`;
      this.logger.warn(errorMessage);
      throw new Error(errorMessage);
    }
  }

  createLocationPoint(latitude: number, longitude: number): string {
    return `POINT(${longitude} ${latitude})`;
  }

  private ensureObject(value: unknown): Record<string, any> {
    if (value && typeof value === "object") {
      return value as Record<string, any>;
    }
    throw new Error("Firebase payload is not an object");
  }

  private parseNumber(
    value: unknown,
    fieldName: string = "coordinate",
    context?: string
  ): number {
    if (value === null || value === undefined) {
      throw new Error(
        `${fieldName} is null or undefined${context ? ` (path: ${context})` : ""}`
      );
    }

    const num = typeof value === "string" ? Number(value) : (value as number);
    if (!Number.isFinite(num)) {
      throw new Error(
        `${fieldName} is not a finite number: received ${JSON.stringify(value)}${context ? ` (path: ${context})` : ""}`
      );
    }
    return num;
  }

  private parseTimestamp(value: string | number | Date): Date {
    if (value instanceof Date) {
      return value;
    }
    // Convert string to number if needed (timestamp keys in Firebase are strings)
    const numValue = typeof value === "string" ? parseInt(value, 10) : value;
    const parsed = new Date(numValue);
    if (isNaN(+parsed)) {
      throw new Error("Invalid timestamp value");
    }
    return parsed;
  }

  private async findExistingRecord(
    userId: string,
    tripId: string | null,
    timestamp: Date,
    queryRunner?: QueryRunner
  ): Promise<GpsLog | null> {
    try {
      const where = {
        userId,
        tripId: tripId ?? IsNull(),
        timestamp,
      };

      if (queryRunner) {
        return await queryRunner.manager.findOne(GpsLog, { where });
      }
      return await this.gpsLogRepository.findOne({ where });
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to find existing GPS log: userId=${userId}, tripId=${tripId || "null"}, timestamp=${timestamp.toISOString()}`,
        err.stack
      );
      throw err;
    }
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: {
      context: string;
      retryOptions?: RetryOptions;
    }
  ): Promise<T | null> {
    const retryOpts = {
      ...this.defaultRetryOptions,
      ...options.retryOptions,
    };
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retryOpts.maxAttempts!; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        const isLastAttempt = attempt === retryOpts.maxAttempts;

        // Don't retry validation errors - they won't succeed on retry
        const isValidationError =
          lastError.message.includes("Invalid Firebase payload") ||
          lastError.message.includes("is not a finite number") ||
          lastError.message.includes("is null or undefined") ||
          lastError.message.includes("Missing") ||
          lastError.message.includes("Invalid GPS data payload");

        if (isLastAttempt || isValidationError) {
          if (isValidationError) {
            this.logger.warn(
              `Skipping invalid data (not retrying): ${options.context}. Error: ${lastError.message}`
            );
          } else {
            this.logger.error(
              `Operation failed after ${retryOpts.maxAttempts} attempts. Context: ${options.context}`,
              lastError.stack
            );
          }
          return null;
        }

        const delay = retryOpts.delayMs! * attempt; // Exponential backoff
        this.logger.warn(
          `Operation failed (attempt ${attempt}/${retryOpts.maxAttempts}). Retrying in ${delay}ms. Context: ${options.context}. Error: ${lastError.message}`
        );

        await this.sleep(delay);
      }
    }

    return null;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async queryGpsLogs(
    userId: string,
    tripId: string,
    beginDate?: Date,
    endDate?: Date,
    limit: number = 100,
  ): Promise<GpsLog[]> {
    try {
      const query = this.gpsLogRepository
        .createQueryBuilder('gps')
        .where('gps.userId = :userId', { userId })
        .andWhere('gps.tripId = :tripId', { tripId });

      if (beginDate && endDate) {
        // If date range is provided, filter by date range
        query.andWhere('gps.timestamp BETWEEN :beginDate AND :endDate', {
          beginDate,
          endDate,
        });
      }

      // Order by timestamp descending to get newest first
      const logs = await query
        .orderBy('gps.timestamp', 'DESC')
        .take(limit)
        .getMany();

      this.logger.debug(
        `Retrieved ${logs.length} GPS logs for userId=${userId}, tripId=${tripId}, limit=${limit}`,
      );

      return logs;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to query GPS logs: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }
}
