import { IsUUID, IsOptional, IsDateString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryGpsLogDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  tripId: string;

  @IsOptional()
  @IsDateString()
  beginDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit: number = 100;
}
