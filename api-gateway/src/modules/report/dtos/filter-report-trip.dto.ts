import { IsOptional, IsString, IsDateString } from 'class-validator';
import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterReportTripDto extends BaseRequestFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignee_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  created_by?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string; 
}
