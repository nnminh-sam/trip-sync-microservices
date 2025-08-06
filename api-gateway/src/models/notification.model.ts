import { ApiProperty } from '@nestjs/swagger';
import { BaseModel } from 'src/models/base.model';
import { User } from 'src/models/user.model';

export class Notification extends BaseModel {
  @ApiProperty({
    description: 'User ID to receive this notification',
    type: 'string',
  })
  userId: string;

  @ApiProperty({
    description: 'Notification message content',
    type: 'string',
  })
  message: string;

  @ApiProperty({
    description: 'Whether the notification has been read',
    type: 'boolean',
    example: false,
  })
  isRead: boolean;

  @ApiProperty({
    description: 'User object',
    type: () => User,
  })
  user?: User;
}
