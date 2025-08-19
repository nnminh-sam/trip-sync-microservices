import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GPSLog } from 'src/models/gps-log.model';
import { TrackGPSDto } from '../dtos/track-gps.dto';

export interface GPSOptimizationConfig {
  // Minimum distance in meters to consider as movement
  minMovementDistance: number;
  // Minimum time in seconds between stationary point saves
  stationaryPointInterval: number;
  // Maximum time in seconds to keep stationary points
  maxStationaryDuration: number;
  // Speed threshold in km/h to detect stationary
  stationarySpeedThreshold: number;
  // Distance threshold in meters for same location
  sameLocationRadius: number;
}

@Injectable()
export class GPSOptimizationService {
  private readonly logger = new Logger(GPSOptimizationService.name);
  
  private readonly defaultConfig: GPSOptimizationConfig = {
    minMovementDistance: 10, // 10 meters
    stationaryPointInterval: 300, // 5 minutes
    maxStationaryDuration: 1800, // 30 minutes
    stationarySpeedThreshold: 5, // 5 km/h
    sameLocationRadius: 25, // 25 meters radius
  };

  constructor(
    @InjectRepository(GPSLog)
    private readonly gpsLogRepo: Repository<GPSLog>,
  ) {}

  /**
   * Optimized GPS tracking that handles stationary detection
   */
  async trackGPSOptimized(
    dto: TrackGPSDto,
    userId: string,
    config: Partial<GPSOptimizationConfig> = {},
  ): Promise<{ saved: boolean; reason?: string; data?: any }> {
    const cfg = { ...this.defaultConfig, ...config };
    
    // Get the last GPS log for this trip
    const lastLog = await this.gpsLogRepo.findOne({
      where: {
        trip_id: dto.tripId,
        user_id: userId,
      },
      order: {
        timestamp: 'DESC',
      },
    });

    if (!lastLog) {
      // First point - always save
      return { saved: true, reason: 'first_point' };
    }

    // Calculate distance from last point
    const distance = this.calculateDistance(
      Number(lastLog.latitude),
      Number(lastLog.longitude),
      dto.latitude,
      dto.longitude,
    );

    // Calculate time difference in seconds
    const timeDiff = 
      (new Date(dto.timestamp).getTime() - lastLog.timestamp.getTime()) / 1000;

    // Check if user is stationary
    const isStationary = 
      distance < cfg.sameLocationRadius && 
      (!dto.speed || dto.speed < cfg.stationarySpeedThreshold);

    if (isStationary) {
      // User is stationary
      this.logger.debug(
        `User stationary at trip ${dto.tripId}: distance=${distance}m, time=${timeDiff}s`,
      );

      // Check if we should save a stationary point
      if (timeDiff >= cfg.stationaryPointInterval) {
        // Save periodic stationary point
        return {
          saved: true,
          reason: 'stationary_interval',
          data: {
            distance,
            timeSinceLastPoint: timeDiff,
            status: 'stationary',
          },
        };
      } else {
        // Skip this point - too soon since last stationary save
        return {
          saved: false,
          reason: 'stationary_skip',
          data: {
            distance,
            timeSinceLastPoint: timeDiff,
            nextSaveIn: cfg.stationaryPointInterval - timeDiff,
          },
        };
      }
    } else {
      // User is moving
      if (distance >= cfg.minMovementDistance) {
        // Significant movement detected
        return {
          saved: true,
          reason: 'movement_detected',
          data: {
            distance,
            timeSinceLastPoint: timeDiff,
            status: 'moving',
          },
        };
      } else {
        // Minor movement - might be GPS drift
        if (timeDiff >= cfg.stationaryPointInterval) {
          // Save anyway due to time interval
          return {
            saved: true,
            reason: 'time_interval',
            data: {
              distance,
              timeSinceLastPoint: timeDiff,
              status: 'minor_movement',
            },
          };
        } else {
          // Skip - minor movement and too soon
          return {
            saved: false,
            reason: 'minor_movement_skip',
            data: {
              distance,
              timeSinceLastPoint: timeDiff,
            },
          };
        }
      }
    }
  }

  /**
   * Compress existing GPS logs by removing redundant stationary points
   */
  async compressGPSLogs(
    tripId: string,
    config: Partial<GPSOptimizationConfig> = {},
  ): Promise<{ 
    originalCount: number; 
    compressedCount: number; 
    removedCount: number;
    compressionRatio: number;
  }> {
    const cfg = { ...this.defaultConfig, ...config };
    
    // Get all logs for the trip
    const logs = await this.gpsLogRepo.find({
      where: { trip_id: tripId },
      order: { timestamp: 'ASC' },
    });

    if (logs.length <= 2) {
      return {
        originalCount: logs.length,
        compressedCount: logs.length,
        removedCount: 0,
        compressionRatio: 0,
      };
    }

    const toKeep: GPSLog[] = [logs[0]]; // Always keep first point
    const toRemove: GPSLog[] = [];
    let lastKeptLog = logs[0];
    let stationaryStartLog: GPSLog | null = null;
    let stationaryPoints: GPSLog[] = [];

    for (let i = 1; i < logs.length - 1; i++) {
      const currentLog = logs[i];
      const distance = this.calculateDistance(
        Number(lastKeptLog.latitude),
        Number(lastKeptLog.longitude),
        Number(currentLog.latitude),
        Number(currentLog.longitude),
      );

      const timeDiff = 
        (currentLog.timestamp.getTime() - lastKeptLog.timestamp.getTime()) / 1000;

      if (distance < cfg.sameLocationRadius) {
        // Stationary point
        if (!stationaryStartLog) {
          stationaryStartLog = lastKeptLog;
          stationaryPoints = [currentLog];
        } else {
          stationaryPoints.push(currentLog);
        }
      } else {
        // Movement detected
        if (stationaryStartLog && stationaryPoints.length > 0) {
          // Process stationary segment
          const stationaryDuration = 
            (stationaryPoints[stationaryPoints.length - 1].timestamp.getTime() - 
             stationaryStartLog.timestamp.getTime()) / 1000;

          if (stationaryDuration > cfg.stationaryPointInterval) {
            // Keep one point every interval
            let lastKeptTime = stationaryStartLog.timestamp.getTime();
            
            for (const point of stationaryPoints) {
              const pointTime = point.timestamp.getTime();
              if ((pointTime - lastKeptTime) / 1000 >= cfg.stationaryPointInterval) {
                toKeep.push(point);
                lastKeptTime = pointTime;
              } else {
                toRemove.push(point);
              }
            }
          } else {
            // Remove all intermediate stationary points
            toRemove.push(...stationaryPoints.slice(0, -1));
            toKeep.push(stationaryPoints[stationaryPoints.length - 1]);
          }

          stationaryStartLog = null;
          stationaryPoints = [];
        }

        toKeep.push(currentLog);
        lastKeptLog = currentLog;
      }
    }

    // Always keep last point
    toKeep.push(logs[logs.length - 1]);

    // Calculate compression stats
    const compressionRatio = 
      ((logs.length - toKeep.length) / logs.length) * 100;

    this.logger.log(
      `GPS compression for trip ${tripId}: ${logs.length} -> ${toKeep.length} points (${compressionRatio.toFixed(1)}% reduction)`,
    );

    // Remove redundant points from database
    if (toRemove.length > 0) {
      const removeIds = toRemove.map(log => log.id);
      await this.gpsLogRepo.delete(removeIds);
    }

    return {
      originalCount: logs.length,
      compressedCount: toKeep.length,
      removedCount: toRemove.length,
      compressionRatio,
    };
  }

  /**
   * Analyze GPS pattern to detect stationary periods
   */
  async analyzeStationaryPeriods(
    tripId: string,
    config: Partial<GPSOptimizationConfig> = {},
  ): Promise<{
    totalDuration: number;
    movingDuration: number;
    stationaryDuration: number;
    stationaryPeriods: Array<{
      startTime: Date;
      endTime: Date;
      duration: number;
      location: { latitude: number; longitude: number };
      pointCount: number;
    }>;
  }> {
    const cfg = { ...this.defaultConfig, ...config };
    
    const logs = await this.gpsLogRepo.find({
      where: { trip_id: tripId },
      order: { timestamp: 'ASC' },
    });

    if (logs.length < 2) {
      return {
        totalDuration: 0,
        movingDuration: 0,
        stationaryDuration: 0,
        stationaryPeriods: [],
      };
    }

    const stationaryPeriods: Array<{
      startTime: Date;
      endTime: Date;
      duration: number;
      location: { latitude: number; longitude: number };
      pointCount: number;
    }> = [];

    let currentPeriod: typeof stationaryPeriods[0] | null = null;
    let lastLog = logs[0];
    let totalStationaryTime = 0;

    for (let i = 1; i < logs.length; i++) {
      const currentLog = logs[i];
      const distance = this.calculateDistance(
        Number(lastLog.latitude),
        Number(lastLog.longitude),
        Number(currentLog.latitude),
        Number(currentLog.longitude),
      );

      if (distance < cfg.sameLocationRadius) {
        // Stationary
        if (!currentPeriod) {
          currentPeriod = {
            startTime: lastLog.timestamp,
            endTime: currentLog.timestamp,
            duration: 0,
            location: {
              latitude: Number(lastLog.latitude),
              longitude: Number(lastLog.longitude),
            },
            pointCount: 2,
          };
        } else {
          currentPeriod.endTime = currentLog.timestamp;
          currentPeriod.pointCount++;
        }
      } else {
        // Movement
        if (currentPeriod) {
          currentPeriod.duration = 
            (currentPeriod.endTime.getTime() - currentPeriod.startTime.getTime()) / 1000;
          
          if (currentPeriod.duration >= cfg.stationaryPointInterval) {
            stationaryPeriods.push(currentPeriod);
            totalStationaryTime += currentPeriod.duration;
          }
          currentPeriod = null;
        }
      }

      lastLog = currentLog;
    }

    // Handle last period if still stationary
    if (currentPeriod) {
      currentPeriod.duration = 
        (currentPeriod.endTime.getTime() - currentPeriod.startTime.getTime()) / 1000;
      
      if (currentPeriod.duration >= cfg.stationaryPointInterval) {
        stationaryPeriods.push(currentPeriod);
        totalStationaryTime += currentPeriod.duration;
      }
    }

    const totalDuration = 
      (logs[logs.length - 1].timestamp.getTime() - logs[0].timestamp.getTime()) / 1000;

    return {
      totalDuration,
      movingDuration: totalDuration - totalStationaryTime,
      stationaryDuration: totalStationaryTime,
      stationaryPeriods,
    };
  }

  /**
   * Get GPS data summary with optimization metrics
   */
  async getGPSDataSummary(tripId: string): Promise<{
    totalPoints: number;
    redundantPoints: number;
    storageSize: number;
    potentialSavings: number;
    recommendations: string[];
  }> {
    const logs = await this.gpsLogRepo.find({
      where: { trip_id: tripId },
    });

    // Analyze redundancy
    let redundantCount = 0;
    const recommendations: string[] = [];

    for (let i = 1; i < logs.length; i++) {
      const distance = this.calculateDistance(
        Number(logs[i - 1].latitude),
        Number(logs[i - 1].longitude),
        Number(logs[i].latitude),
        Number(logs[i].longitude),
      );

      const timeDiff = 
        (logs[i].timestamp.getTime() - logs[i - 1].timestamp.getTime()) / 1000;

      if (distance < 10 && timeDiff < 60) {
        redundantCount++;
      }
    }

    const redundancyRate = (redundantCount / logs.length) * 100;
    const estimatedSize = logs.length * 100; // ~100 bytes per record
    const potentialSavings = redundantCount * 100;

    if (redundancyRate > 30) {
      recommendations.push(
        `High redundancy detected (${redundancyRate.toFixed(1)}%). Consider enabling GPS optimization.`
      );
    }

    if (logs.length > 1000) {
      recommendations.push(
        'Large dataset detected. Consider compressing historical GPS data.'
      );
    }

    const analysis = await this.analyzeStationaryPeriods(tripId);
    const stationaryRate = (analysis.stationaryDuration / analysis.totalDuration) * 100;

    if (stationaryRate > 50) {
      recommendations.push(
        `High stationary time (${stationaryRate.toFixed(1)}%). Implement adaptive tracking intervals.`
      );
    }

    return {
      totalPoints: logs.length,
      redundantPoints: redundantCount,
      storageSize: estimatedSize,
      potentialSavings,
      recommendations,
    };
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}