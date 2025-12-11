import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTripLocationDto {
  @IsString()
  @IsNotEmpty()
  location_id: string;

  @IsNotEmpty()
  arrival_order: number;

  @IsOptional()
  @IsDateString()
  scheduled_at?: string;
}

export class CreateTripDto {
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(100, { message: 'Title must not exceed 100 characters' })
  title: string;

  @IsString()
  @IsOptional()
  assignee_id?: string;

  @IsString()
  @IsNotEmpty()
  manager_id: string;

  @IsString()
  @IsNotEmpty()
  purpose: string;

  @IsString()
  @IsNotEmpty()
  goal: string;

  @IsNotEmpty()
  schedule: Date;

  @IsNotEmpty()
  deadline: Date;

  @IsOptional()
  note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTripLocationDto)
  locations: CreateTripLocationDto[];
}
