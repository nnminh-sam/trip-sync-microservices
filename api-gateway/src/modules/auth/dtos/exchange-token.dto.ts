import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExchangeTokenDto {
  @ApiProperty({ description: 'Access token to exchange' })
  @IsNotEmpty()
  @IsString()
  accessToken: string;

  @ApiProperty({ description: 'Refresh token to exchange' })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
