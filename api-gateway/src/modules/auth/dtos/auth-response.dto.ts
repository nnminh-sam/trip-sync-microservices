import { ApiProperty, ApiResponse } from '@nestjs/swagger';
import { User } from 'src/models/user.model';

export class AuthResponseDto {
  @ApiProperty({
    description: 'User data',
    type: User,
  })
  user: User;

  @ApiProperty({
    description: 'Access token',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token',
  })
  refreshToken: string;
}
