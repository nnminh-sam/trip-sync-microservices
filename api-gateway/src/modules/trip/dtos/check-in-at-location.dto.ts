import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

export class CheckInAtLocationDto {
  @ApiProperty({
    description: "Trip's location ID that user is checking in",
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
    description: "Client's check-in timestamp",
    required: true,
  })
  @IsDateString()
  @IsNotEmpty()
  timestamp: Date;

  @ApiProperty({
    description: "Client's check-in attachment ID",
    type: 'string',
    required: true,
  })
  @IsUUID()
  @IsNotEmpty()
  attachmentId: string;
}
