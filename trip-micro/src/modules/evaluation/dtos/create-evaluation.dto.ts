import { IsEnum, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { EvaluationValueEnum } from 'src/models/evaluation-value.enum';

export class CreateEvaluationDto {
  @IsUUID()
  @IsNotEmpty()
  trip_id: string;

  @IsEnum(EvaluationValueEnum)
  @IsNotEmpty()
  evaluation_value: EvaluationValueEnum;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000, { message: 'Comment must not exceed 5000 characters' })
  comment: string;
}
