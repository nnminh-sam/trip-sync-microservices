import { BaseModel } from 'src/models/base.model';
import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/models/user.model';

export class Notification extends BaseModel {
  @ApiProperty({
    description: 'Notification content',
  })
  message: string;

  @ApiProperty({
    description: 'Read status',
  })
  is_read: boolean;


  @ApiProperty({
    description: 'User has this notification',
  })
  user_id: string;
}
