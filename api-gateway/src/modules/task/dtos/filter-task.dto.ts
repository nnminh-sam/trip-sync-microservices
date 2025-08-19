import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';
import { TaskStatusEnum } from 'src/models/task-status.enum';

export class FilterTaskDto extends BaseRequestFilterDto {
  @ApiProperty({
    description: "Trip's location ID, UUID value",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  tripLocationId?: string;

  @ApiProperty({
    description: "Trip ID, UUID value",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  tripId?: string;

  @ApiProperty({
    description: "Task's title",
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: "Task's status",
    required: false,
    enum: TaskStatusEnum,
  })
  @IsOptional()
  @IsEnum(TaskStatusEnum)
  @Transform(({ value }) => value?.toUpperCase())
  status?: TaskStatusEnum;

  @ApiProperty({
    description: "Task's deadline",
    required: false,
  })
  @IsOptional()
  @IsDate()
  deadline?: Date;

  @ApiProperty({
    description: "Task's start timestamp",
    required: false,
  })
  @IsOptional()
  @IsDate()
  startedAt?: Date;

  @ApiProperty({
    description: "Task's completion timestamp",
    required: false,
  })
  @IsOptional()
  @IsDate()
  completedAt?: Date;

  @ApiProperty({
    description: "Task's approval timestamp",
    required: false,
  })
  @IsOptional()
  @IsDate()
  approvedAt?: Date;

  @ApiProperty({
    description: "User who approved the task (UUID)",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  approvedBy?: string;

  @ApiProperty({
    description: "Task's rejection timestamp",
    required: false,
  })
  @IsOptional()
  @IsDate()
  rejectedAt?: Date;

  @ApiProperty({
    description: "User who rejected the task (UUID)",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  rejectedBy?: string;

  @ApiProperty({
    description: "Task's cancelation timestamp",
    required: false,
  })
  @IsOptional()
  @IsDate()
  canceledAt?: Date;

  @ApiProperty({
    description: "Filter only active tasks (not canceled or rejected)",
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value?.toLowerCase() === 'true' || value === true)
  activeOnly?: boolean = true;
}
