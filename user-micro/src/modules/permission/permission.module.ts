import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';
import { Permission } from 'src/models/permission.model';
import { RolePermission } from 'src/models/role-permission.model';
import { RoleModule } from 'src/modules/role/role.module';

@Module({
  imports: [RoleModule, TypeOrmModule.forFeature([Permission, RolePermission])],
  controllers: [PermissionController],
  providers: [PermissionService],
  exports: [PermissionService],
})
export class PermissionModule {}
