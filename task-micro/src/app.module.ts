import { Module } from '@nestjs/common';
import { TaskModule } from './modules/task/task.module';
import { TaskProofModule } from './modules/task-proof/task-proof.module';

@Module({
  imports: [TaskModule, TaskProofModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
