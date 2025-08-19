import { IsEnum, IsBoolean, IsOptional, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  PDF = 'pdf'
}

export enum GroupByOption {
  DAY = 'day',
  WEEK = 'week', 
  MONTH = 'month',
  TRIP = 'trip',
  EMPLOYEE = 'employee',
  DEPARTMENT = 'department'
}

export class DateRangeDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}

export class ExportConfigDto {
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @IsOptional()
  @IsBoolean()
  include_media?: boolean = false;

  @IsOptional()
  @IsBoolean()
  include_locations?: boolean = false;

  @IsOptional()
  @IsBoolean()
  include_evidence?: boolean = false;

  @ValidateNested()
  @Type(() => DateRangeDto)
  date_range: DateRangeDto;

  @IsOptional()
  @IsEnum(GroupByOption)
  group_by?: GroupByOption;

  @IsOptional()
  @IsBoolean()
  include_summary?: boolean = true;

  @IsOptional()
  @IsBoolean()
  include_charts?: boolean = false;
}

export class ExportRequestDto {
  @ValidateNested()
  @Type(() => ExportConfigDto)
  config: ExportConfigDto;

  @IsOptional()
  filters?: any;
}