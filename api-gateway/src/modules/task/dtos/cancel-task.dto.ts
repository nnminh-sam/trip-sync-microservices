import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsUUID,
  IsString,
  IsNumber,
  ValidateNested,
  MinLength,
  IsEnum,
} from 'class-validator';
import { MediaTypeEnum } from 'src/models/media-type.enum';

export class CancellationProofDto {
  @ApiProperty({
    description: 'Proof name',
    example: 'Proof of Completion',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Media URL',
    example: 'https://example.com/proof.jpg',
  })
  @IsNotEmpty()
  @IsString()
  mediaUrl: string;

  @ApiProperty({
    description: 'Media type',
    enum: MediaTypeEnum,
    example: MediaTypeEnum.PNG,
  })
  @IsNotEmpty()
  @IsEnum(MediaTypeEnum)
  mediaType: MediaTypeEnum;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 10.762622,
  })
  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 106.660172,
  })
  @IsNotEmpty()
  @IsNumber()
  longitude: number;
}

export class CancelTaskDto {
  @ApiProperty({
    description: 'Canceler ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  cancelerId: string;

  @ApiProperty({
    description: 'Reason for canceling the task',
    example: 'Task no longer needed due to change in requirements',
    minLength: 10,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10, {
    message: 'Cancel reason must be at least 10 characters long',
  })
  cancelReason: string;

  @ApiProperty({
    description: 'Cancellation proof',
    type: CancellationProofDto,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CancellationProofDto)
  proof: CancellationProofDto;
}
