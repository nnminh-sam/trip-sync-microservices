import { Module } from '@nestjs/common';
import { ClientModule } from 'src/client/client.module';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from 'src/config';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ClientModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
    }),
    DatabaseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
