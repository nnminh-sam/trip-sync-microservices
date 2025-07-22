import { IsDate, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateTaskDto {
  @IsNotEmpty()
  @IsUUID()
  tripLocationId: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  status: 'pending' | 'completed' | 'canceled';

  @IsNotEmpty()
  @IsString()
  note: string;

  @IsNotEmpty()
  @IsDate()
  deadline: Date;
}
