import { Module } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { ClientModule } from 'src/client/client.module';

@Module({
  imports: [ClientModule],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
