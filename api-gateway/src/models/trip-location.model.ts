import { ApiProperty } from '@nestjs/swagger';
import { BaseModel } from 'src/models/base.model';

export class TripLocation extends BaseModel{
  @ApiProperty({ description: 'Location ID (from location-micro)' })
  location_id: string;

  @ApiProperty({ description: 'Order of arrival at this location' })
  arrival_order: number;

  @ApiProperty({
    description: 'Scheduled arrival time',
    type: String,
    format: 'date-time',
    required: false,
  })
  scheduled_at?: Date;

  @ApiProperty({ description: 'Trip ID this location belongs to' })
  trip_id: string;
}
