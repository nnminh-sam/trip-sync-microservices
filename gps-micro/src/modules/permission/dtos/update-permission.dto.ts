import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdatePermissionDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  action?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  resource?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
