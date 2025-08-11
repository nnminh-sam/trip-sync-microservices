import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { ClientModule } from 'src/client/client.module';
import { TaskProofModule } from 'src/modules/task-proof/task-proof.module';

@Module({
  imports: [ClientModule, TaskProofModule],
  providers: [TaskService],
  controllers: [TaskController],
})
export class TaskModule {}
