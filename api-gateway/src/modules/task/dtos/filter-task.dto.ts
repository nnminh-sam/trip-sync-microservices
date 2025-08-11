import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';
import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';

export class FilterTaskDto extends BaseRequestFilterDto {
  @ApiProperty({
    description: "Trip's location ID, UUID value",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  tripLocationId?: string;

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
  })
  @IsOptional()
  @IsString()
  status?: 'pending' | 'completed' | 'canceled';

  @ApiProperty({
    description: "Task's deadline",
    required: false,
  })
  @IsOptional()
  @IsDate()
  deadline?: Date;

  @ApiProperty({
    description: "Task's completion timestamp",
    required: false,
  })
  @IsOptional()
  @IsDate()
  completedAt?: Date;

  @ApiProperty({
    description: "Task's cancelation timestamp",
    required: false,
  })
  @IsOptional()
  @IsDate()
  canceledAt?: Date;
}
