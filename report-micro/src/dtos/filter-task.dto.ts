import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';


export class FilterTaskDto {
  @IsOptional()
  @IsString()
  trip_id?: string;

  @IsOptional()
  @IsDateString()
  created_at_from?: string;

  @IsOptional()
  @IsDateString()
  created_at_to?: string;

  
  @IsOptional()
  @IsDateString()
  completed_at_from?: string;

  @IsOptional()
  @IsDateString()
  completed_at_to?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  size?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'created_at';

  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc' = 'desc';
}
