import { IsOptional, IsUUID, IsDateString, IsString } from 'class-validator';
import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';

export class FilterTripDto extends BaseRequestFilterDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  assignee_id?: string;

  @IsOptional()
  @IsDateString()
  from_date?: string;

  @IsOptional()
  @IsDateString()
  to_date?: string;

}