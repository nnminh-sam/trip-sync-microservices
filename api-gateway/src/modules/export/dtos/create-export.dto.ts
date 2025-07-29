import { IsEnum, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FilterReportDto } from './filter-report.dto';

export enum ExportType {
  TRIP_SUMMARY = 'trip_summary',
  TASK_COMPLETION = 'task_completion',
}
export class CreateExportDto {
  @IsEnum(ExportType)
  type: ExportType;

  @IsObject()
  @ValidateNested()
  @Type(() => FilterReportDto)
  filters: FilterReportDto;
}
