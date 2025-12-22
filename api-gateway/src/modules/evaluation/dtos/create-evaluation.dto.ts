import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export enum EvaluationValueEnum {
  SUCCESSFUL = 'successful',
  PARTIALLY_SUCCESSFUL = 'partially_successful',
  UNSUCCESSFUL = 'unsuccessful',
  POSTPONED = 'postponed',
}

export class CreateEvaluationDto {
  @ApiProperty({
    description: 'The ID of the trip being evaluated',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    required: true,
  })
  @IsUUID()
  @IsNotEmpty()
  trip_id: string;

  @ApiProperty({
    description: 'Evaluation value',
    example: 'successful',
    required: true,
  })
  @IsEnum(EvaluationValueEnum)
  @IsNotEmpty()
  evaluation_value: EvaluationValueEnum;

  @ApiProperty({
    description: 'Comment regarding the evaluation',
    example: 'The trip was completed successfully with all objectives met.',
    required: true,
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000, { message: 'Comment must not exceed 5000 characters' })
  comment: string;
}
