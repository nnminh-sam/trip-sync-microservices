import { IsOptional, IsString, IsDateString, IsInt } from 'class-validator';
import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';

export class FilterReportTripDto extends BaseRequestFilterDto {
  @IsOptional()
  @IsInt()
  assignee?: string;

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
