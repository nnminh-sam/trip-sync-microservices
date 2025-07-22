import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TaskService {
  private readonly logger: Logger = new Logger(TaskService.name);
}
