import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({
    description: "Task's title",
    example: "Get client's approval for TripSync project",
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: "Task's description",
    example:
      'Present the project to the client and convince them to approve the solution for the TripSync project',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Additional note',
    example: 'Our client is quite hard to convince so be pacient',
    required: false,
  })
  @IsString()
  @IsOptional()
  note?: string;
}
