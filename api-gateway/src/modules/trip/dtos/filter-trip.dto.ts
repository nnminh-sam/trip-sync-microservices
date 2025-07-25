import { IsOptional, IsString } from 'class-validator';
import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';

export class FilterTripDto extends BaseRequestFilterDto {
  @IsOptional()
  @IsString()
  name?: string;
}