import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsBoolean, IsNumber, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class RouteQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by start timestamp',
    example: '2024-01-15T08:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({
    description: 'Filter by end timestamp',
    example: '2024-01-15T18:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Return simplified route',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  simplified?: boolean = false;
}

export class RoutePointDto {
  @ApiProperty({
    description: 'Latitude coordinate',
    example: 21.0285,
  })
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 105.8542,
  })
  longitude: number;

  @ApiProperty({
    description: 'Timestamp when the point was recorded',
    example: '2024-01-15T10:30:00Z',
  })
  timestamp: string;

  @ApiPropertyOptional({
    description: 'Speed at this point in km/h',
    example: 60.5,
  })
  speed?: number;

  @ApiPropertyOptional({
    description: 'Heading at this point in degrees',
    example: 45.0,
  })
  heading?: number;
}

export class TripRouteResponseDto {
  @ApiProperty({
    description: 'Trip ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  tripId: string;

  @ApiProperty({
    description: 'Array of route points',
    type: [RoutePointDto],
  })
  route: RoutePointDto[];

  @ApiProperty({
    description: 'Total distance traveled in kilometers',
    example: 25.5,
  })
  totalDistance: number;

  @ApiProperty({
    description: 'Total duration in minutes',
    example: 120,
  })
  duration: number;

  @ApiProperty({
    description: 'Start time of the route',
    example: '2024-01-15T08:00:00Z',
  })
  startTime: string;

  @ApiProperty({
    description: 'End time of the route',
    example: '2024-01-15T10:00:00Z',
  })
  endTime: string;

  @ApiProperty({
    description: 'Whether the route is simplified',
    example: false,
  })
  isSimplified: boolean;

  @ApiProperty({
    description: 'Number of points in the route',
    example: 150,
  })
  pointCount: number;
}

export class StopQueryDto {
  @ApiPropertyOptional({
    description: 'Minimum stop duration in minutes',
    example: 5,
    default: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  minDuration?: number = 5;
}

export class TripStopDto {
  @ApiProperty({
    description: 'Stop location',
    type: Object,
    example: { latitude: 21.0285, longitude: 105.8542 },
  })
  location: {
    latitude: number;
    longitude: number;
  };

  @ApiProperty({
    description: 'Arrival time at the stop',
    example: '2024-01-15T09:00:00Z',
  })
  arrivalTime: string;

  @ApiProperty({
    description: 'Departure time from the stop',
    example: '2024-01-15T09:30:00Z',
  })
  departureTime: string;

  @ApiProperty({
    description: 'Duration of the stop in minutes',
    example: 30,
  })
  duration: number;

  @ApiPropertyOptional({
    description: 'Address of the stop (if available)',
    example: '123 Le Loi Street, Hanoi',
  })
  address?: string;

  @ApiPropertyOptional({
    description: 'Matched location name (if near a known location)',
    example: 'Client Office - ABC Company',
  })
  matchedLocation?: string;
}

export class TripStopsResponseDto {
  @ApiProperty({
    description: 'Array of detected stops',
    type: [TripStopDto],
  })
  stops: TripStopDto[];

  @ApiProperty({
    description: 'Total number of stops',
    example: 3,
  })
  totalStops: number;

  @ApiProperty({
    description: 'Total stop time in minutes',
    example: 75,
  })
  totalStopTime: number;

  @ApiProperty({
    description: 'Trip ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  tripId: string;
}