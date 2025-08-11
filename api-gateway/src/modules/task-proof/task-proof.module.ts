import { Module } from '@nestjs/common';
import { TaskProofController } from './task-proof.controller';
import { TaskProofService } from './task-proof.service';
import { ClientModule } from 'src/client/client.module';

@Module({
  imports: [ClientModule],
  controllers: [TaskProofController],
  providers: [TaskProofService],
  exports: [TaskProofService],
})
export class TaskProofModule {}
