import { Module } from '@nestjs/common';
import { ClientModule } from 'src/client/client.module';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from 'src/config';
import { DatabaseModule } from './database/database.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';

@Module({
  imports: [
    ClientModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
    }),
    DatabaseModule,
    AuditLogModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
