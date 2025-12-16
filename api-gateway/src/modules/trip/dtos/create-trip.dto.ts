import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateTaskDto } from 'src/modules/task/dtos/create-task.dto';

export class CreateTripLocationDto {
  @ApiProperty({
    description: 'Location ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  location_id: string;

  @ApiProperty({
    description: 'Arrival order',
    example: '1',
  })
  @IsNotEmpty()
  arrival_order: number;

  @ApiProperty({
    description: "Employee's task at this trip's location",
    required: true,
    type: CreateTaskDto,
  })
  @IsNotEmpty()
  task: CreateTaskDto;
}

export class CreateTripDto {
  @ApiProperty({
    description: 'Trip title',
    example: 'Business Meeting in Hanoi',
  })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(100, { message: 'Title must not exceed 100 characters' })
  title: string;

  @ApiProperty({
    description: 'User ID assigned to this trip',
    example: 'user-uuid-123',
  })
  @IsString()
  @IsOptional()
  assignee_id?: string;

  @ApiProperty({
    description: 'Purpose of the trip',
    example: 'Client meeting and site inspection',
  })
  @IsString()
  @IsNotEmpty()
  purpose: string;

  @ApiProperty({
    description: 'Goal of the trip',
    example: 'Get client approval for the project',
  })
  @IsString()
  @IsNotEmpty()
  goal: string;

  @ApiProperty({
    description: 'Schedule time for the trip',
    example: '2024-01-15T08:00:00Z',
  })
  @IsNotEmpty()
  schedule: Date;

  @ApiProperty({
    description: 'Deadline time for the trip',
    example: '2024-01-17T18:00:00Z',
  })
  @IsNotEmpty()
  deadline: Date;

  @ApiProperty({
    description: 'Notes for the trip',
    example: 'Contact client at least 1 day before visit',
  })
  @IsOptional()
  note?: string;

  @ApiProperty({
    description: 'Locations of the trip',
    type: CreateTripLocationDto,
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTripLocationDto)
  locations: CreateTripLocationDto[];
}
