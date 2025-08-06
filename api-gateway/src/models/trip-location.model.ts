import { ApiProperty } from '@nestjs/swagger';
import { BaseModel } from 'src/models/base.model';
import { Trip } from 'src/models/trip.model';
import { Location } from 'src/models/location.model';

export class TripLocation extends BaseModel {
  @ApiProperty({
    description: 'Trip ID this location belongs to',
    type: 'string',
  })
  tripId: string;

  @ApiProperty({
    description: 'Location ID',
    type: 'string',
  })
  locationId: string;

  @ApiProperty({
    description: 'Order of arrival at this location',
    type: 'number',
    example: 1,
  })
  arrivalOrder: number;

  @ApiProperty({
    description: 'Scheduled time to arrive at this location',
    type: 'string',
    format: 'date-time',
  })
  scheduledAt: Date;

  @ApiProperty({
    description: 'Trip object',
    type: () => Trip,
  })
  trip?: Trip;

  @ApiProperty({
    description: 'Location object',
    type: () => Location,
  })
  location?: Location;
}
