import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsOptional, IsString } from 'class-validator';

export class UpdateTaskDto {
  @ApiProperty({
    description: "Task's title",
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: "Task's description",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "Task's status",
    required: false,
    examples: ['pending', 'completed', 'canceled'],
  })
  @IsOptional()
  @IsString()
  status?: 'pending' | 'completed' | 'canceled';

  @ApiProperty({
    description: "Task's note",
    required: false,
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({
    description: "Task's deadline",
    required: false,
  })
  @IsOptional()
  // @IsDate()
  deadline?: Date;
}
