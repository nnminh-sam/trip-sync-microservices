import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsUUID,
  IsString,
  IsNumber,
  IsOptional,
  IsUrl,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { MediaTypeEnum } from 'src/models/media-type.enum';

export class CompletionProofDto {
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
  @IsUrl()
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

export class CompleteTaskDto {
  @ApiProperty({
    description: 'Assignee ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  assigneeId: string;

  @ApiProperty({
    description: 'Completion proof',
    type: CompletionProofDto,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CompletionProofDto)
  proof: CompletionProofDto;

  @ApiProperty({
    description: 'Optional note',
    example: 'Task completed successfully',
    required: false,
  })
  @IsOptional()
  @IsString()
  note?: string;
}
