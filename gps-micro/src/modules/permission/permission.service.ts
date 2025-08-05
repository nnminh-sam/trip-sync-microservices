import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);

  constructor() {}
}
