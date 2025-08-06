import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
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
  @IsOptional()
  assignee_id?: string;

  @IsString()
  @IsNotEmpty()
  created_by: string; 

  @IsString()
  @IsNotEmpty()
  purpose: string;

  @IsString()
  @IsNotEmpty()
  goal: string;

  @IsString()
  @IsNotEmpty()
  schedule: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTripLocationDto)
  locations: CreateTripLocationDto[];
}
