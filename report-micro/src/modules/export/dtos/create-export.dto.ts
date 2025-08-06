import { IsOptional, IsString, IsDateString, IsIn} from 'class-validator';

export class CreateExportDto {
  @IsIn(['csv', 'xlsx'])
  format: string;

  @IsIn(['trips', 'tasks']) // customize export types
  export_type: string;

  @IsDateString()
  date_from: string;

  @IsDateString()
  date_to: string;

  @IsOptional()
  @IsString()
  filters?: string; // must be valid JSON string

  @IsOptional()
  @IsString()
  columns?: string; // must be valid JSON string
}
