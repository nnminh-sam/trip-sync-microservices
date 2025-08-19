import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsDateString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class RealtimeLocationQueryDto {
  @ApiPropertyOptional({
    description: 'Comma-separated user IDs',
    example: '123e4567-e89b-12d3-a456-426614174000,223e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.split(',').filter(Boolean))
  userIds?: string;

  @ApiPropertyOptional({
    description: 'Comma-separated trip IDs',
    example: '323e4567-e89b-12d3-a456-426614174000,423e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.split(',').filter(Boolean))
  tripIds?: string;

  @ApiPropertyOptional({
    description: 'Get updates since this timestamp',
    example: '2024-01-15T10:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  since?: string;
}

export class RealtimeLocationDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'Trip ID',
    example: '323e4567-e89b-12d3-a456-426614174000',
  })
  tripId: string;

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
    description: 'Timestamp of the location',
    example: '2024-01-15T10:30:00Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Speed in km/h',
    example: 60.5,
    nullable: true,
  })
  speed: number | null;

  @ApiProperty({
    description: 'Heading in degrees',
    example: 45.0,
    nullable: true,
  })
  heading: number | null;

  @ApiPropertyOptional({
    description: 'User full name',
    example: 'John Doe',
  })
  userFullName?: string;

  @ApiPropertyOptional({
    description: 'Trip purpose',
    example: 'Client meeting in Hanoi',
  })
  tripPurpose?: string;
}

export class RealtimeLocationsResponseDto {
  @ApiProperty({
    description: 'Array of real-time locations',
    type: [RealtimeLocationDto],
  })
  locations: RealtimeLocationDto[];

  @ApiProperty({
    description: 'Total count of locations',
    example: 10,
  })
  total: number;

  @ApiProperty({
    description: 'Timestamp of the response',
    example: '2024-01-15T10:30:00Z',
  })
  timestamp: string;
}

export class WebSocketSubscribeDto {
  @ApiProperty({
    description: 'WebSocket action',
    example: 'subscribe',
    enum: ['subscribe', 'unsubscribe'],
  })
  action: 'subscribe' | 'unsubscribe';

  @ApiProperty({
    description: 'Array of trip IDs to subscribe to',
    type: [String],
    example: ['323e4567-e89b-12d3-a456-426614174000'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  tripIds: string[];
}

export class WebSocketLocationUpdateDto {
  @ApiProperty({
    description: 'Event type',
    example: 'location_update',
  })
  event: string;

  @ApiProperty({
    description: 'Location data',
    type: RealtimeLocationDto,
  })
  data: RealtimeLocationDto;

  @ApiProperty({
    description: 'Event timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  timestamp: string;
}