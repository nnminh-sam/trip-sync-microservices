import { ApiProperty } from '@nestjs/swagger';
import { BaseModel } from 'src/models/base.model';

export class Location extends BaseModel{
  @ApiProperty({ description: 'Name of the location' })
  name: string;

  @ApiProperty({ description: 'Address of the location', required: false })
  address?: string;

  @ApiProperty({ description: 'Latitude of the location', required: false, example: 21.028511 })
  
  latitude?: number;

  @ApiProperty({ description: 'Longitude of the location', required: false, example: 105.804817 })
  longitude?: number;

  @ApiProperty({ description: 'Description of the location', required: false })
  description?: string;

}
