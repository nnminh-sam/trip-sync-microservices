import { BaseRequestFilterDto } from '../../../dtos/base-request-filter.dto';
import { IsBoolean, IsDate, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class FilterTaskDto extends BaseRequestFilterDto {
  @IsOptional()
  @IsUUID()
  tripLocationId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  status?: 'pending' | 'completed' | 'canceled';

  @IsOptional()
  @IsDate()
  deadline?: Date;

  @IsOptional()
  @IsDate()
  completedAt?: Date;

  @IsOptional()
  @IsDate()
  canceledAt?: Date;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  activeOnly?: boolean = true;
}
