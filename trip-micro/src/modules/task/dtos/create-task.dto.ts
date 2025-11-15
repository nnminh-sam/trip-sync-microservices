import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({
    description: "Trip's location ID, UUID value",
  })
  @IsNotEmpty()
  @IsUUID()
  tripLocationId: string;

  @ApiProperty({
    description: "Task's title",
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: "Task's description",
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: "Task's note",
  })
  @IsNotEmpty()
  @IsString()
  note: string;

  @ApiProperty({
    description: "Task's deadline",
  })
  @IsNotEmpty()
  deadline: Date;
}
