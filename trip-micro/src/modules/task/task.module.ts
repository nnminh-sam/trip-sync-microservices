import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TaskController } from './task.controller';
import { DatabaseModule } from 'src/database/database.module';
import { Task } from 'src/models/task.model';
import { Cancelation } from 'src/models/cancelation.model';
import gcsConfig from 'src/config/gcs.config';
import { TaskService } from './task.service';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([Task, Cancelation]),
    ConfigModule.forFeature(gcsConfig),
  ],
  providers: [TaskService],
  controllers: [TaskController],
  exports: [TaskService],
})
export class TaskModule {}
