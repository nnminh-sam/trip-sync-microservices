import { Injectable, Logger } from '@nestjs/common';
import * as turf from '@turf/turf';
import { LocationReportDto, LocationPointDto, CheckInOutDto } from '../dtos/location-report.dto';

export interface LocationHistory {
  employee_id: string;
  trip_id: string;
  locations: LocationPointDto[];
  total_distance_km: number;
  check_in?: CheckInOutDto;
  check_out?: CheckInOutDto;
  duration_hours?: number;
}

export interface LocationSummary {
  trip_id: string;
  employee_id: string;
  total_distance_km: number;
  average_speed_kmh: number;
  time_at_location_hours: number;
  time_traveling_hours: number;
  visited_locations: number;
}

@Injectable()
export class LocationTrackingService {
  private readonly logger = new Logger(LocationTrackingService.name);
  private locationCache: Map<string, LocationHistory> = new Map();

  async trackLocation(employeeId: string, tripId: string, location: LocationPointDto): Promise<void> {
    const key = `${tripId}_${employeeId}`;
    const history = this.locationCache.get(key) || {
      employee_id: employeeId,
      trip_id: tripId,
      locations: [],
      total_distance_km: 0,
    };

    history.locations.push(location);
    
    // Calculate distance if there's a previous location
    if (history.locations.length > 1) {
      const prevLocation = history.locations[history.locations.length - 2];
      const distance = this.calculateDistance(
        prevLocation.lat,
        prevLocation.lng,
        location.lat,
        location.lng
      );
      history.total_distance_km += distance;
    }

    this.locationCache.set(key, history);
    this.logger.debug(`Location tracked for employee ${employeeId} on trip ${tripId}`);
  }

  async recordCheckIn(employeeId: string, tripId: string, checkIn: CheckInOutDto): Promise<void> {
    const key = `${tripId}_${employeeId}`;
    const history = this.locationCache.get(key) || {
      employee_id: employeeId,
      trip_id: tripId,
      locations: [],
      total_distance_km: 0,
    };

    history.check_in = checkIn;
    this.locationCache.set(key, history);
    
    // Also track as a location point
    await this.trackLocation(employeeId, tripId, {
      ...checkIn,
      activity: 'check_in',
    });

    this.logger.log(`Check-in recorded for employee ${employeeId} on trip ${tripId}`);
  }

  async recordCheckOut(employeeId: string, tripId: string, checkOut: CheckInOutDto): Promise<void> {
    const key = `${tripId}_${employeeId}`;
    const history = this.locationCache.get(key);
    
    if (!history) {
      throw new Error('No check-in found for this trip');
    }

    history.check_out = checkOut;
    
    // Calculate duration
    if (history.check_in) {
      const checkInTime = new Date(history.check_in.timestamp).getTime();
      const checkOutTime = new Date(checkOut.timestamp).getTime();
      history.duration_hours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
    }

    this.locationCache.set(key, history);
    
    // Also track as a location point
    await this.trackLocation(employeeId, tripId, {
      ...checkOut,
      activity: 'check_out',
    });

    this.logger.log(`Check-out recorded for employee ${employeeId} on trip ${tripId}`);
  }

  async getLocationHistory(tripId: string, employeeId?: string): Promise<LocationHistory[]> {
    const histories: LocationHistory[] = [];
    
    for (const [key, history] of this.locationCache.entries()) {
      if (history.trip_id === tripId) {
        if (!employeeId || history.employee_id === employeeId) {
          histories.push(history);
        }
      }
    }

    return histories;
  }

  async getLiveLocations(tripIds: string[]): Promise<Map<string, LocationPointDto>> {
    const liveLocations = new Map<string, LocationPointDto>();
    
    for (const [key, history] of this.locationCache.entries()) {
      if (tripIds.includes(history.trip_id) && history.locations.length > 0) {
        const latestLocation = history.locations[history.locations.length - 1];
        liveLocations.set(key, latestLocation);
      }
    }

    return liveLocations;
  }

  async calculateRoutePath(locations: LocationPointDto[]): Promise<any> {
    if (locations.length < 2) {
      return null;
    }

    const coordinates = locations.map(loc => [loc.lng, loc.lat]);
    const lineString = turf.lineString(coordinates);
    
    return {
      type: 'Feature',
      geometry: lineString.geometry,
      properties: {
        distance_km: this.calculateTotalDistance(locations),
        duration_hours: this.calculateDuration(locations),
        points: locations.length,
      },
    };
  }

  async generateLocationSummary(tripId: string, employeeId: string): Promise<LocationSummary> {
    const key = `${tripId}_${employeeId}`;
    const history = this.locationCache.get(key);
    
    if (!history || history.locations.length === 0) {
      return {
        trip_id: tripId,
        employee_id: employeeId,
        total_distance_km: 0,
        average_speed_kmh: 0,
        time_at_location_hours: 0,
        time_traveling_hours: 0,
        visited_locations: 0,
      };
    }

    const totalDistance = history.total_distance_km;
    const duration = history.duration_hours || this.calculateDuration(history.locations);
    const averageSpeed = duration > 0 ? totalDistance / duration : 0;
    
    // Calculate time spent at locations vs traveling
    const { timeAtLocation, timeTraveling } = this.calculateTimeDistribution(history.locations);

    return {
      trip_id: tripId,
      employee_id: employeeId,
      total_distance_km: totalDistance,
      average_speed_kmh: averageSpeed,
      time_at_location_hours: timeAtLocation,
      time_traveling_hours: timeTraveling,
      visited_locations: this.countUniqueLocations(history.locations),
    };
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const from = turf.point([lng1, lat1]);
    const to = turf.point([lng2, lat2]);
    return turf.distance(from, to, { units: 'kilometers' });
  }

  private calculateTotalDistance(locations: LocationPointDto[]): number {
    let totalDistance = 0;
    
    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1];
      const curr = locations[i];
      totalDistance += this.calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
    }

    return totalDistance;
  }

  private calculateDuration(locations: LocationPointDto[]): number {
    if (locations.length < 2) {
      return 0;
    }

    const firstTime = new Date(locations[0].timestamp).getTime();
    const lastTime = new Date(locations[locations.length - 1].timestamp).getTime();
    return (lastTime - firstTime) / (1000 * 60 * 60); // Convert to hours
  }

  private calculateTimeDistribution(locations: LocationPointDto[]): { timeAtLocation: number; timeTraveling: number } {
    let timeAtLocation = 0;
    let timeTraveling = 0;
    
    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1];
      const curr = locations[i];
      const timeDiff = (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / (1000 * 60 * 60);
      const distance = this.calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
      
      // If distance is less than 100 meters, consider it as time at location
      if (distance < 0.1) {
        timeAtLocation += timeDiff;
      } else {
        timeTraveling += timeDiff;
      }
    }

    return { timeAtLocation, timeTraveling };
  }

  private countUniqueLocations(locations: LocationPointDto[]): number {
    const uniqueLocations = new Set<string>();
    const threshold = 0.1; // 100 meters threshold for considering locations as same
    
    locations.forEach(location => {
      let isUnique = true;
      
      for (const existing of uniqueLocations) {
        const [lat, lng] = existing.split(',').map(Number);
        const distance = this.calculateDistance(location.lat, location.lng, lat, lng);
        
        if (distance < threshold) {
          isUnique = false;
          break;
        }
      }
      
      if (isUnique) {
        uniqueLocations.add(`${location.lat},${location.lng}`);
      }
    });

    return uniqueLocations.size;
  }

  async detectAnomalies(tripId: string, employeeId: string): Promise<string[]> {
    const anomalies: string[] = [];
    const history = this.locationCache.get(`${tripId}_${employeeId}`);
    
    if (!history || history.locations.length < 2) {
      return anomalies;
    }

    // Check for excessive speed
    for (let i = 1; i < history.locations.length; i++) {
      const prev = history.locations[i - 1];
      const curr = history.locations[i];
      const distance = this.calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
      const timeDiff = (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / (1000 * 60 * 60);
      
      if (timeDiff > 0) {
        const speed = distance / timeDiff;
        if (speed > 200) { // More than 200 km/h is likely an anomaly
          anomalies.push(`Excessive speed detected: ${speed.toFixed(2)} km/h at ${curr.timestamp}`);
        }
      }
    }

    // Check for location jumps
    for (let i = 1; i < history.locations.length; i++) {
      const prev = history.locations[i - 1];
      const curr = history.locations[i];
      const distance = this.calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
      
      if (distance > 100) { // Jump of more than 100 km
        anomalies.push(`Large location jump detected: ${distance.toFixed(2)} km at ${curr.timestamp}`);
      }
    }

    return anomalies;
  }

  clearCache(): void {
    this.locationCache.clear();
    this.logger.log('Location cache cleared');
  }
}