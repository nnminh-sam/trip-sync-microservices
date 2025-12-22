import {
  IsOptional,
  IsUUID,
  IsInt,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';
import { EvaluationValueEnum } from './create-evaluation.dto';
import { ApiProperty } from '@nestjs/swagger';

export class FilterEvaluationDto extends BaseRequestFilterDto {
  @ApiProperty({
    description: 'The ID of the trip being evaluated',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  trip_id?: string;

  @ApiProperty({
    description: 'Version number of the evaluation',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  version?: number;

  @ApiProperty({
    description: 'Evaluation value',
    example: 'successful',
    required: false,
  })
  @IsOptional()
  @IsEnum(EvaluationValueEnum)
  evaluation_value?: EvaluationValueEnum;

  @ApiProperty({
    description:
      'Filter evaluations created before this date (ISO 8601 format)',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  created_at_before?: string;

  @ApiProperty({
    description: 'Filter evaluations created after this date (ISO 8601 format)',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  created_at_after?: string;
}
