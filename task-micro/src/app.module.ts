import { Module } from '@nestjs/common';
import { TaskModule } from './modules/task/task.module';
import { TaskProofModule } from './modules/task-proof/task-proof.module';
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
    TaskProofModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
