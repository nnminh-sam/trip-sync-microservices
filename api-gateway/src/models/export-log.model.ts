import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseModel } from './base.model';

export class ExportLog extends BaseModel{
  @ApiProperty()
  requested_by: string;

  @ApiProperty()
  export_type: string;

  @ApiPropertyOptional()
  filter_params?: string;

  @ApiPropertyOptional()
  file_url?: string;
}
