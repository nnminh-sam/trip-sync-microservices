import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { TaskProofTypeEnum } from 'src/models/task-proof-type.enum';
import { MediaTypeEnum } from 'src/models/media-type.enum';

export class CreateTaskProofDto {
  @ApiProperty({
    description: "Task's ID, UUID value",
  })
  @IsNotEmpty()
  @IsUUID()
  taskId: string;

  @ApiProperty({
    description: "Proof's type",
    enum: TaskProofTypeEnum,
  })
  @IsNotEmpty()
  @IsEnum(TaskProofTypeEnum)
  type: TaskProofTypeEnum;

  @ApiProperty({
    description: "Media's URL",
  })
  @IsNotEmpty()
  @IsString()
  mediaUrl: string;

  @ApiProperty({
    description: "Media's type",
    enum: MediaTypeEnum,
  })
  @IsNotEmpty()
  @IsEnum(MediaTypeEnum)
  mediaType: MediaTypeEnum;

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

  @ApiPropertyOptional({
    description: 'Uploader spatial location point for geospatial indexing (WKT format)',
  })
  @IsOptional()
  @IsString()
  locationPoint?: string;

  @ApiPropertyOptional({
    description: 'Description or notes about the proof',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Location accuracy in meters',
  })
  @IsOptional()
  @IsNumber()
  accuracy?: number;
}
