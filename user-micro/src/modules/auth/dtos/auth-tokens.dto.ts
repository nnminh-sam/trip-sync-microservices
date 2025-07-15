import { IsNotEmpty, IsString } from 'class-validator';

export class AuthTokensDto {
  @IsNotEmpty()
  @IsString()
  accessToken: string;

  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
