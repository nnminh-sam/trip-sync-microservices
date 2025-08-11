import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskService } from './services/task.service';
import { TaskController } from './controllers/task.controller';
import { DatabaseModule } from 'src/database/database.module';
import { Task } from 'src/models/task.model';
import { TaskProof } from 'src/models/task-proof.model';
import { TaskStatusManagerService } from './services/task-status-manager.service';
import { TaskProofController } from 'src/modules/task/controllers/task-proof.controller';
import { TaskProofService } from 'src/modules/task/services/task-proof.service';

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([Task, TaskProof])],
  providers: [TaskService, TaskStatusManagerService, TaskProofService],
  controllers: [TaskController, TaskProofController],
  exports: [TaskService, TaskStatusManagerService, TaskProofService],
})
export class TaskModule {}
