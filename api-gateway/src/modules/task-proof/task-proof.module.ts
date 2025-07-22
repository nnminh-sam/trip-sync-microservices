import { Module } from '@nestjs/common';
import { TaskProofController } from './task-proof.controller';
import { TaskProofService } from './task-proof.service';

@Module({
  controllers: [TaskProofController],
  providers: [TaskProofService]
})
export class TaskProofModule {}
