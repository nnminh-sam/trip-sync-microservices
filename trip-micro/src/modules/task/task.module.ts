import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TaskService } from './services/task.service';
import { TaskController } from './controllers/task.controller';
import { DatabaseModule } from 'src/database/database.module';
import { Task } from 'src/models/task.model';
import { TaskProof } from 'src/models/task-proof.model';
import { TaskFile } from 'src/models/task-file.model';
import { TaskStatusManagerService } from './services/task-status-manager.service';
import { TaskProofController } from 'src/modules/task/controllers/task-proof.controller';
import { TaskProofService } from 'src/modules/task/services/task-proof.service';
import { FileUploadService } from './services/file-upload.service';
import { FileUploadController } from './controllers/file-upload.controller';
import { HttpFileUploadController } from './controllers/http-file-upload.controller';
import gcsConfig from 'src/config/gcs.config';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([Task, TaskProof, TaskFile]),
    ConfigModule.forFeature(gcsConfig),
  ],
  providers: [TaskService, TaskStatusManagerService, TaskProofService, FileUploadService],
  controllers: [TaskController, TaskProofController, FileUploadController, HttpFileUploadController],
  exports: [TaskService, TaskStatusManagerService, TaskProofService, FileUploadService],
})
export class TaskModule {}
