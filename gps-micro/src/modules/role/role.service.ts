import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  constructor() {}
}
