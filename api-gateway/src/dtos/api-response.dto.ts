import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto {
  page: number;

  size: number;

  totalPages: number;
}

export class ApiResponseDto<T = null> {
  @ApiProperty({
    description: 'API response return timestamp',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Request path',
  })
  path: string;

  @ApiProperty({
    description: 'Request HTTP method',
  })
  method: string;

  @ApiProperty({
    description: 'API HTTP status code',
  })
  statusCode: number;

  data: T | T[];

  pagination?: PaginationDto;

  @ApiProperty({
    description: 'API response metadata',
    required: false,
  })
  metadata?: Record<string, any>;
}
