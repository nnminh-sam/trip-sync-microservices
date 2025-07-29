import { IsIn, IsInt, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class BaseRequestFilterDto {
  @IsOptional()
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size?: number;
}
