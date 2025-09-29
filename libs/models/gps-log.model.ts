import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseModel } from 'src/models/base.model';
import { Trip } from 'src/models/trip.model';
import { User } from 'src/models/user.model';

export class GPSLog extends BaseModel {
  @ApiProperty({
    description: 'Trip ID this GPS log belongs to',
    type: 'string',
  })
  tripId: string;

  @ApiProperty({
    description: 'User ID who logged this GPS location',
    type: 'string',
  })
  userId: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    type: 'number',
    example: 21.0285,
  })
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    type: 'number',
    example: 105.8542,
  })
  longitude: number;

  @ApiProperty({
    description: 'Timestamp when GPS location was recorded',
    type: 'string',
    format: 'date-time',
  })
  timestamp: Date;

  @ApiProperty({
    description: 'Location point for geospatial indexing',
    type: 'string',
  })
  locationPoint?: string;

  @ApiPropertyOptional({
    description: 'Trip object',
    type: () => Trip,
  })
  trip?: Trip;

  @ApiPropertyOptional({
    description: 'User object',
    type: () => User,
  })
  user?: User;
}
