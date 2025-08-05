import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class GPSAnalyticsQueryDto {
  @ApiProperty({
    description: 'Analysis start date',
    example: '2024-01-01',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Analysis end date',
    example: '2024-01-31',
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    description: 'Specific user ID for analytics',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class MostVisitedLocationDto {
  @ApiProperty({
    description: 'Location ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  locationId: string | null;

  @ApiProperty({
    description: 'Location name',
    example: 'Hanoi Office',
    nullable: true,
  })
  locationName: string | null;

  @ApiProperty({
    description: 'Number of visits',
    example: 25,
  })
  visitCount: number;

  @ApiProperty({
    description: 'Average time spent at location in minutes',
    example: 120,
  })
  averageTimeSpent: number;

  @ApiProperty({
    description: 'Location coordinates',
    example: { latitude: 21.0285, longitude: 105.8542 },
  })
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export class GPSAnalyticsSummaryDto {
  @ApiProperty({
    description: 'Total distance traveled in kilometers',
    example: 1250.5,
  })
  totalDistance: number;

  @ApiProperty({
    description: 'Total number of trips',
    example: 42,
  })
  totalTrips: number;

  @ApiProperty({
    description: 'Average speed in km/h',
    example: 45.5,
  })
  averageSpeed: number;

  @ApiProperty({
    description: 'Total duration in hours',
    example: 125,
  })
  totalDuration: number;

  @ApiProperty({
    description: 'Most visited locations',
    type: [MostVisitedLocationDto],
  })
  mostVisitedLocations: MostVisitedLocationDto[];

  @ApiProperty({
    description: 'Analysis period',
    example: {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    },
  })
  period: {
    startDate: string;
    endDate: string;
  };

  @ApiPropertyOptional({
    description: 'User information (if specific user analytics)',
    example: {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      fullName: 'John Doe',
    },
  })
  user?: {
    userId: string;
    fullName: string;
  };

  @ApiProperty({
    description: 'Movement statistics',
    example: {
      totalStops: 85,
      averageStopDuration: 35,
      longestTrip: { tripId: '...', distance: 125.5, duration: 180 },
      mostProductiveDay: { date: '2024-01-15', distance: 85.5, trips: 3 },
    },
  })
  movementStats: {
    totalStops: number;
    averageStopDuration: number;
    longestTrip: {
      tripId: string;
      distance: number;
      duration: number;
    };
    mostProductiveDay: {
      date: string;
      distance: number;
      trips: number;
    };
  };
}

export class TripStatisticsDto {
  @ApiProperty({
    description: 'Trip ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  tripId: string;

  @ApiProperty({
    description: 'Total distance in meters',
    example: 25500,
  })
  totalDistance: number;

  @ApiProperty({
    description: 'Duration in minutes',
    example: 120,
  })
  duration: number;

  @ApiProperty({
    description: 'Average speed in km/h',
    example: 45.5,
  })
  averageSpeed: number;

  @ApiProperty({
    description: 'Maximum speed in km/h',
    example: 80.0,
  })
  maxSpeed: number;

  @ApiProperty({
    description: 'Number of GPS points recorded',
    example: 150,
  })
  pointCount: number;

  @ApiProperty({
    description: 'Number of stops detected',
    example: 3,
  })
  stopCount: number;

  @ApiProperty({
    description: 'Trip efficiency score (0-100)',
    example: 85,
  })
  efficiencyScore: number;
}