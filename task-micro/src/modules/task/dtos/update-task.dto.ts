import { IsDate, IsOptional, IsString } from 'class-validator';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: 'pending' | 'completed' | 'canceled';

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDate()
  deadline?: Date;
}
