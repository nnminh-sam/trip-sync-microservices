import { ApiProperty } from '@nestjs/swagger';
import { BaseModel } from 'src/models/base.model';
import { User } from 'src/models/user.model';

export class Location extends BaseModel {
  @ApiProperty({
    description: 'Location name',
    type: 'string',
    example: 'TripSync HQ',
  })
  name: string;

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
    description: 'Offset radius for location accuracy (in meters)',
    type: 'number',
    example: 100.0,
  })
  offsetRadius: number;

  @ApiProperty({
    description: 'User ID who created this location',
    type: 'string',
  })
  createdBy: string;

  @ApiProperty({
    description: 'Creator user object',
    type: () => User,
    required: false,
  })
  creator?: User;
}