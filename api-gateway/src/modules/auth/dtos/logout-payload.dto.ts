import { IsNotEmpty, IsString } from 'class-validator';

export class LogoutPayloadDto {
  @IsNotEmpty()
  @IsString()
  accessToken: string;

  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
