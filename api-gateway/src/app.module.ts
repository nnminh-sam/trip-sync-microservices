import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from 'src/config';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClientModule } from './client/client.module';
import { RoleModule } from './modules/role/role.module';
import { PermissionModule } from './modules/permission/permission.module';
import { DatabaseModule } from './database/database.module';
import { TaskModule } from './modules/task/task.module';
import { TaskProofModule } from './modules/task-proof/task-proof.module';
import { LocationModule } from './modules/location/location.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
    }),
    UserModule,
    AuthModule,
    ClientModule,
    RoleModule,
    PermissionModule,
    DatabaseModule,
    TaskModule,
    TaskProofModule,
    LocationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
