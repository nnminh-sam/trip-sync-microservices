import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';


export class FilterTripDto {
  @IsOptional()
  @IsString()
  assignee_id?: string;

  @IsOptional()
  @IsString()
  created_by?: string;

  @IsOptional()
  @IsDateString()
  from_date?: string;

  @IsOptional()
  @IsDateString()
  to_date?: string;

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
