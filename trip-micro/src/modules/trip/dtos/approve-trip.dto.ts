import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ApproveTripDto {
  @IsString()
  @IsNotEmpty()
  decision: 'approve' | 'reject';

  @IsString()
  @IsOptional()
  note?: string;
}
