import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthorizeClaimPayloadDto {
  @ApiProperty({ description: 'Roles to authorize' })
  @IsNotEmpty()
  roles: string[];

  @ApiProperty({ description: 'Action to authorize' })
  @IsNotEmpty()
  @IsString()
  action: string;

  @ApiProperty({ description: 'Resource to authorize' })
  @IsNotEmpty()
  @IsString()
  resource: string;
}
