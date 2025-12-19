import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

export class CheckOutAtLocationDto {
  @ApiProperty({
    description: "Trip's location ID that user is checking out",
    required: true,
  })
  @IsUUID()
  @IsNotEmpty()
  tripLocationId?: string;

  @ApiProperty({
    description: 'Latitude value',
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @ApiProperty({
    description: 'Longitude value',
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @ApiProperty({
    description: "Client's check-out timestamp",
    required: true,
  })
  @IsDateString()
  @IsNotEmpty()
  timestamp: Date;

  @ApiProperty({
    description: "Client's check-out attachment ID",
    type: 'string',
    required: true,
  })
  @IsUUID()
  @IsNotEmpty()
  attachmentId: string;
}
