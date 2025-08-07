import { ApiProperty } from '@nestjs/swagger';

export class ValidationResultDto {
  @ApiProperty({ description: 'Whether the coordinates are within the location radius' })
  isValid: boolean;

  @ApiProperty({ description: 'Distance from the coordinates to the location center in meters' })
  distance: number;

  @ApiProperty({ description: 'Maximum allowed radius for the location in meters' })
  maxRadius: number;

  @ApiProperty({ description: 'Name of the location' })
  locationName: string;

  @ApiProperty({ required: false, description: 'Additional message about the validation result' })
  message?: string;
}