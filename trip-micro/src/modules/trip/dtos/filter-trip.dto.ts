import {
  IsOptional,
  IsUUID,
  IsDateString,
  IsString,
  IsBoolean,
} from 'class-validator';
import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';

export class FilterTripDto extends BaseRequestFilterDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsUUID()
  assignee_id?: string;

  @IsOptional()
  @IsDateString()
  from_date_schedule?: string;

  @IsOptional()
  @IsDateString()
  to_date_schedule?: string;

  @IsOptional()
  @IsDateString()
  from_date_deadline?: string;

  @IsOptional()
  @IsDateString()
  to_date_deadline?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID()
  manager_id?: string;

  @IsOptional()
  @IsString()
  is_evaluated?: 'true' | 'false';
}
