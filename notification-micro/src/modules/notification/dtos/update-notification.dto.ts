import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateNotificationDto {
  @ApiPropertyOptional({
    description: 'Trạng thái đã đọc (true: đã đọc, false: chưa đọc)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_read?: boolean;

}
