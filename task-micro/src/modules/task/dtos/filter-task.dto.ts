import { BaseRequestFilterDto } from '../../../dtos/base-request-filter.dto';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TaskStatusEnum } from 'src/models/task-status.enum';

export class FilterTaskDto extends BaseRequestFilterDto {
  @IsOptional()
  @IsUUID()
  tripLocationId?: string;

  @IsOptional()
  @IsUUID()
  tripId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(TaskStatusEnum)
  @Transform(({ value }) => value.toUpperCase())
  status?: TaskStatusEnum;

  @IsOptional()
  deadline?: Date;

  @IsOptional()
  startedAt?: Date;

  @IsOptional()
  completedAt?: Date;

  @IsOptional()
  approvedAt?: Date;

  @IsOptional()
  @IsUUID()
  approvedBy?: string;

  @IsOptional()
  rejectedAt?: Date;

  @IsOptional()
  @IsUUID()
  rejectedBy?: string;

  @IsOptional()
  canceledAt?: Date;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value.toLowerCase() === 'true' || value === true)
  activeOnly?: boolean = true;
}
