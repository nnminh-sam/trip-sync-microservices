import { Transform } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { TaskStatusEnum } from 'src/models/task-status.enum';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatusEnum)
  @Transform(({ value }) => value.toUpperCase())
  status?: TaskStatusEnum;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDate()
  deadline?: Date;

  @IsOptional()
  @IsUUID()
  approvedBy?: string;

  @IsOptional()
  @IsUUID()
  rejectedBy?: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  cancelReason?: string;
}
