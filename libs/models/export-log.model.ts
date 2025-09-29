import { ApiProperty } from '@nestjs/swagger';
import { BaseModel } from 'src/models/base.model';
import { User } from 'src/models/user.model';

export class ExportLog extends BaseModel {
  @ApiProperty({
    description: 'User ID who requested this export',
    type: 'string',
  })
  requestedBy: string;

  @ApiProperty({
    description: 'Type of export requested',
    type: 'string',
    example: 'trips',
  })
  exportType: string;

  @ApiProperty({
    description: 'Filter parameters used for export as JSON string',
    type: 'string',
    example: '{"status": "completed", "date_from": "2024-01-01"}',
  })
  filterParams: string;

  @ApiProperty({
    description: 'URL to download the exported file',
    type: 'string',
    required: false,
  })
  fileUrl?: string;

  @ApiProperty({
    description: 'Export status',
    type: 'string',
    enum: ['pending', 'processing', 'completed', 'failed'],
    example: 'completed',
  })
  status: string;

  @ApiProperty({
    description: 'Error message if export failed',
    type: 'string',
    required: false,
  })
  errorMessage?: string;

  @ApiProperty({
    description: 'User object who requested the export',
    type: () => User,
  })
  requester?: User;
}
