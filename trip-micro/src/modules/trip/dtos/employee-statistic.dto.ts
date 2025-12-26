import { IsDateString, IsOptional } from 'class-validator';

export class EmployeeStatisticDto {
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
}
