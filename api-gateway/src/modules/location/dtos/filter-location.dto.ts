import { IsOptional, IsString } from 'class-validator';

export class FilterLocationDto {
  @IsOptional()
  @IsString()
  name?: string;
}