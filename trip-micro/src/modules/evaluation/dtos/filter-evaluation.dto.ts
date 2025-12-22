import { IsOptional, IsUUID, IsInt, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';
import { EvaluationValueEnum } from 'src/models/evaluation-value.enum';

export class FilterEvaluationDto extends BaseRequestFilterDto {
  @IsOptional()
  @IsUUID()
  trip_id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  version?: number;

  @IsOptional()
  @IsEnum(EvaluationValueEnum)
  evaluation_value?: EvaluationValueEnum;

  @IsOptional()
  @IsDateString()
  created_at_before?: string;

  @IsOptional()
  @IsDateString()
  created_at_after?: string;
}
