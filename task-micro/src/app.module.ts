import { Module } from '@nestjs/common';
import { TaskModule } from './modules/task/task.module';
import { DatabaseModule } from 'src/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from 'src/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
    }),
    DatabaseModule,
    TaskModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
