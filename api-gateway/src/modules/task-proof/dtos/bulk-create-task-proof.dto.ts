import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { TaskProofTypeEnum } from 'src/models/task-proof-type.enum';
import { MediaTypeEnum } from 'src/models/media-type.enum';

export class CreateBulkTaskProofItemDto {
  @ApiProperty({
    description: 'Type of proof',
    enum: TaskProofTypeEnum,
  })
  @IsEnum(TaskProofTypeEnum)
  @IsNotEmpty()
  proofType: TaskProofTypeEnum;

  @ApiProperty({
    description: 'Media type of the proof',
    enum: MediaTypeEnum,
  })
  @IsEnum(MediaTypeEnum)
  @IsNotEmpty()
  mediaType: MediaTypeEnum;

  @ApiProperty({
    description: 'URL or path to the media file',
  })
  @IsString()
  @IsNotEmpty()
  mediaUrl: string;

  @ApiProperty({
    description: 'Description or notes about the proof',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Location point as WKT string (e.g., "POINT(longitude latitude)")',
    required: false,
  })
  @IsString()
  @IsOptional()
  locationPoint?: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiProperty({
    description: 'Location accuracy in meters',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  accuracy?: number;
}

export class BulkCreateTaskProofDto {
  @ApiProperty({
    description: 'Task ID to create proofs for',
  })
  @IsUUID()
  @IsNotEmpty()
  taskId: string;

  @ApiProperty({
    description: 'User ID who submits the proofs',
  })
  @IsUUID()
  @IsNotEmpty()
  submittedBy: string;

  @ApiProperty({
    description: 'Array of proofs to create (minimum 1, maximum 10)',
    type: [CreateBulkTaskProofItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBulkTaskProofItemDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  proofs: CreateBulkTaskProofItemDto[];
}