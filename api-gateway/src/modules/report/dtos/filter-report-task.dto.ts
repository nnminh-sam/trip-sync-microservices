import { IsOptional, IsString, IsDateString } from 'class-validator';
import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterReportTaskDto extends BaseRequestFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trip_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  created_at_from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  created_at_to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  completed_at_from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  completed_at_to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}
