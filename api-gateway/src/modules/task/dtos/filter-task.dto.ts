import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';

export class FilterTaskDto {
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
