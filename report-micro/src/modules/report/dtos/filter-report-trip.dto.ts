import { IsOptional, IsString, IsDateString, IsInt } from 'class-validator';
import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';

export class FilterReportTripDto extends BaseRequestFilterDto {
  @IsOptional()
  @IsString()
  assignee_id?: string;

  @IsOptional()
  @IsString()
  created_by?: string;

  @IsOptional()
  @IsDateString()
  from_date?: string;

  @IsOptional()
  @IsDateString()
  to_date?: string;

  @IsOptional()
  @IsString()
  status?: string; 
}
