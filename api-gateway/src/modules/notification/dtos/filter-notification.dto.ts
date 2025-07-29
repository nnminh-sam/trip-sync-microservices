import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsUUID, IsString } from 'class-validator';
import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';

export class FilterNotificationDto extends BaseRequestFilterDto {
  @ApiPropertyOptional({
    description: 'Lọc theo trạng thái đã đọc (true: đã đọc, false: chưa đọc)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_read?: boolean;

  @ApiPropertyOptional({
    description: 'ID người dùng nhận thông báo',
    example: 'a3f1c5d9-9d1a-4b19-b60e-871e7a934c12',
  })
  @IsOptional()
  @IsString()
  user_id?: string;
}
