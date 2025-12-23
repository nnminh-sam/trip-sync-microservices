import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { TokenClaimsDto } from '../../../dtos/token-claims.dto';

export class SendNotificationDto {
  @IsString()
  @IsNotEmpty({ message: 'Path to database is required' })
  path: string;

  @IsObject()
  @IsNotEmpty({ message: 'Notification data is required' })
  data:
    | Record<string, any>
    | {
        senderId: string;
        receiverId: string;
        title: string;
        message: string;
        is_read?: boolean;
      };

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  claims?: TokenClaimsDto;
}
