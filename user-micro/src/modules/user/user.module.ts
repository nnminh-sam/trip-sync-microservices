import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from 'src/models/user.model';
import { RoleModule } from 'src/modules/role/role.module';
import { EmailModule } from 'src/modules/email/email.module';
<<<<<<< HEAD
import { AuditLogModule } from 'src/modules/audit-log/audit-log.module';

@Module({
  imports: [
    AuditLogModule,
    RoleModule,
    EmailModule,
    TypeOrmModule.forFeature([User]),
  ],
=======

@Module({
  imports: [RoleModule, EmailModule, TypeOrmModule.forFeature([User])],
>>>>>>> 62582d2d8d5a9e15911cb43ebcc851a86e92d547
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
