import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationService {
  private readonly logger: Logger = new Logger(NotificationService.name);
}