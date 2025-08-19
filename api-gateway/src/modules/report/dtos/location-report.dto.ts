import { IsString, IsArray, IsDateString, IsOptional, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class LocationPointDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsDateString()
  timestamp: string;

  @IsOptional()
  @IsString()
  activity?: string;
}

export class CheckInOutDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsDateString()
  timestamp: string;
}

export class LocationReportDto {
  @IsString()
  employee_id: string;

  @IsString()
  trip_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocationPointDto)
  locations: LocationPointDto[];

  @ValidateNested()
  @Type(() => CheckInOutDto)
  check_in: CheckInOutDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CheckInOutDto)
  check_out?: CheckInOutDto;
}

export class FilterLocationReportDto {
  @IsOptional()
  @IsString()
  employee_id?: string;

  @IsOptional()
  @IsString()
  trip_id?: string;

  @IsOptional()
  @IsDateString()
  from_date?: string;

  @IsOptional()
  @IsDateString()
  to_date?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  trip_ids?: string[];
}