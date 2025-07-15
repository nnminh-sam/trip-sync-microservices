import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ClientModule } from 'src/client/client.module';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from 'src/config';
import { DatabaseModule } from './database/database.module';
import { RoleModule } from './modules/role/role.module';
import { PermissionModule } from './modules/permission/permission.module';
import { PermissionService } from 'src/modules/permission/permission.service';
import { RoleService } from 'src/modules/role/role.service';
import { UserService } from 'src/modules/user/user.service';

@Module({
  imports: [
    ClientModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
    }),
    AuthModule,
    DatabaseModule,
    PermissionModule,
    UserModule,
    RoleModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly roleService: RoleService,
    private readonly userService: UserService,
  ) {
    this.onStartUp();
  }

  async onStartUp() {
    const systemAdminPermissionIds = await this.permissionService.onStartUp();
    await this.roleService.onStartUp(systemAdminPermissionIds);
    await this.userService.onStartUp();
  }
}
