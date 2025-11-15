import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from 'src/models/user.model';
import { RoleModule } from 'src/modules/role/role.module';
import { AuditLogModule } from 'src/modules/audit-log/audit-log.module';
import { PermissionGuard } from 'src/common/guards/permission.guard';

@Module({
  imports: [AuditLogModule, RoleModule, TypeOrmModule.forFeature([User])],
  providers: [UserService, PermissionGuard],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
