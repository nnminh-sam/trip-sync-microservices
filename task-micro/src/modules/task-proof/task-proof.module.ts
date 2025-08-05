import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskProofService } from './task-proof.service';
import { TaskProofController } from './task-proof.controller';
import { TaskModule } from 'src/modules/task/task.module';
import { DatabaseModule } from 'src/database/database.module';
import { TaskProof } from 'src/models/task-proof.model';

@Module({
  imports: [DatabaseModule, TaskModule, TypeOrmModule.forFeature([TaskProof])],
  providers: [TaskProofService],
  controllers: [TaskProofController],
})
export class TaskProofModule {}
