import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';
import { IsOptional, IsUUID } from 'class-validator';
import { IsString } from 'class-validator';
import { IsNumber } from 'class-validator';

export class FilterLocationDto extends BaseRequestFilterDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsUUID()
  createdBy?: string;
}
