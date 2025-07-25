import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTripLocationDto {
  @ApiProperty({ example: 'location-uuid-123' })
  @IsString()
  @IsNotEmpty()
  location_id: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  arrival_order: number;

  @ApiProperty({ example: '2025-08-01T08:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  scheduled_at?: string;
}

export class CreateTripDto {
  @ApiProperty({
    example: 'user-uuid-123',
    required: false,
    description: 'Người được giao (có thể bỏ trống)',
  })
  @IsOptional()
  @IsString()
  assignee_id?: string;

  @ApiProperty({ example: 'Khảo sát địa điểm mới' })
  @IsString()
  @IsNotEmpty()
  purpose: string;

  @ApiProperty({ example: 'Thu thập dữ liệu hiện trạng' })
  @IsString()
  @IsNotEmpty()
  goal: string;

  @ApiProperty({ example: 'Sáng thứ 2, tuần tới' })
  @IsString()
  @IsNotEmpty()
  schedule: string;

  @ApiProperty({ type: [CreateTripLocationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTripLocationDto)
  locations: CreateTripLocationDto[];

}
