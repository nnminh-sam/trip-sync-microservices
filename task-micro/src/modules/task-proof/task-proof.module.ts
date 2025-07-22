import { Module } from '@nestjs/common';
import { TaskProofService } from './task-proof.service';
import { TaskProofController } from './task-proof.controller';

@Module({
  providers: [TaskProofService],
  controllers: [TaskProofController]
})
export class TaskProofModule {}
