import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { DatabaseModule } from 'src/database/database.module';
import { Task } from 'src/models/task.model';
import { TaskProof } from 'src/models/task-proof.model';
import { TaskStatusManagerService } from './services/task-status-manager.service';
import { TaskProofModule } from '../task-proof/task-proof.module';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([Task, TaskProof]),
    forwardRef(() => TaskProofModule),
  ],
  providers: [TaskService, TaskStatusManagerService],
  controllers: [TaskController],
  exports: [TaskService, TaskStatusManagerService],
})
export class TaskModule {}
