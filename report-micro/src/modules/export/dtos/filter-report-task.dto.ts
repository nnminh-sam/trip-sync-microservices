import { IsOptional, IsString, IsDateString, IsInt } from 'class-validator';
import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';

export class FilterReportTaskDto extends BaseRequestFilterDto {
  @IsOptional()
  @IsString()
  trip_id?: string;

  @IsOptional()
  @IsDateString()
  created_at_from?: string;

  @IsOptional()
  @IsDateString()
  created_at_to?: string;

  @IsOptional()
  @IsDateString()
  completed_at_from?: string;

  @IsOptional()
  @IsDateString()
  completed_at_to?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
