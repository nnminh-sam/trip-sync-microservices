import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { Role } from 'src/models/role.model';
import { RolePermission } from 'src/models/role-permission.model';
import { Permission } from 'src/models/permission.model';
import { AuditLogModule } from 'src/modules/audit-log/audit-log.module';

@Module({
  imports: [
    AuditLogModule,
    TypeOrmModule.forFeature([Role, RolePermission, Permission]),
  ],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
