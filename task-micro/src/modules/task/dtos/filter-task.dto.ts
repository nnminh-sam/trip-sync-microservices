import { BaseRequestFilterDto } from './../../../../../api-gateway/src/dtos/base-request-filter.dto';
import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';

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
}
