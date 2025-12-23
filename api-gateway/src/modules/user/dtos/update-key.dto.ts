import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateKeyDto {
  @ApiProperty({
    description: 'New public key of the user',
    required: false,
  })
  @IsOptional()
  @IsString()
  publicKey?: string;

  @ApiProperty({
    description: 'Android device token of user for push notifications',
    required: false,
  })
  @IsNotEmpty()
  @IsString()
  deviceToken: string;
}
