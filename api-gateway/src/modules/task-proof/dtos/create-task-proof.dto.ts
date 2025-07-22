import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateTaskProofDto {
  @ApiProperty({
    description: "Task's ID, UUID value",
  })
  @IsNotEmpty()
  @IsUUID()
  taskId: string;

  @ApiProperty({
    description: "Proof's type",
    examples: ['completion', 'cancellation'],
  })
  @IsNotEmpty()
  @IsString()
  type: 'completion' | 'cancellation';

  @ApiProperty({
    description: "Media's URL",
  })
  @IsNotEmpty()
  @IsString()
  mediaUrl: string;

  @ApiProperty({
    description: "Media's type",
    examples: ['photo', 'video'],
  })
  @IsNotEmpty()
  @IsString()
  mediaType: 'photo' | 'video';

  @ApiProperty({
    description: 'Uploader latitude',
  })
  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @ApiProperty({
    description: 'Uploader longitude',
  })
  @IsNotEmpty()
  @IsNumber()
  longitude: number;

  @ApiProperty({
    description: 'Upload timestamp',
  })
  @IsNotEmpty()
  @IsDate()
  timestamp: Date;

  @ApiProperty({
    description: 'Uploader ID, UUID value',
  })
  @IsNotEmpty()
  @IsUUID()
  uploadedBy: string;

  @ApiProperty({
    description: 'Uploader spatial location point for geospatial indexing',
  })
  @IsNotEmpty()
  @IsString()
  locationPoint: string;
}
