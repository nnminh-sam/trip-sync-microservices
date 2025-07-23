import { Module } from '@nestjs/common';
import { TaskProofService } from './task-proof.service';
import { TaskProofController } from './task-proof.controller';
import { TaskProof } from 'src/models/task-proof.model';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([TaskProof])],
  providers: [TaskProofService],
  controllers: [TaskProofController],
})
export class TaskProofModule {}
