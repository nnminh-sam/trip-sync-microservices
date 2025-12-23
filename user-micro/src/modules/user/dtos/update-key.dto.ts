import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateKeyDto {
  @IsOptional()
  @IsString()
  publicKey?: string;

  @IsNotEmpty()
  @IsString()
  deviceToken: string;
}
