import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { ApiResponseConstruction } from 'src/common/decorators/api-response-construction.decorator';
import { RequestUserClaims } from 'src/common/decorators/request-user-claims.decorator';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { Task } from 'src/models/task.model';
import { TaskProof } from 'src/models/task-proof.model';
import { CreateTaskProofDto } from 'src/modules/task-proof/dtos/create-task-proof.dto';
import { BulkCreateTaskProofDto } from 'src/modules/task-proof/dtos/bulk-create-task-proof.dto';
import { FilterTaskProofDto } from 'src/modules/task-proof/dtos/filter-task-proof.dto';
import { TaskProofService } from 'src/modules/task-proof/task-proof.service';
import { CreateTaskDto } from 'src/modules/task/dtos/create-task.dto';
import { FilterTaskDto } from 'src/modules/task/dtos/filter-task.dto';
import { UpdateTaskDto } from 'src/modules/task/dtos/update-task.dto';
import { ApproveTaskDto } from 'src/modules/task/dtos/approve-task.dto';
import { RejectTaskDto } from 'src/modules/task/dtos/reject-task.dto';
import { CompleteTaskDto } from 'src/modules/task/dtos/complete-task.dto';
import { CancelTaskDto } from 'src/modules/task/dtos/cancel-task.dto';
import { FileUploadDto, BulkFileUploadDto, FileUploadResponseDto } from 'src/modules/task/dtos/file-upload.dto';
import { TaskService } from 'src/modules/task/task.service';

@ApiBearerAuth()
@ApiTags('Task')
@Controller('tasks')
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly taskProofService: TaskProofService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List/Filter tasks' })
  @ApiResponseConstruction({
    status: 200,
    description: 'List of tasks',
    model: Task,
    isArray: true,
  })
  async findAll(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Query() payload: FilterTaskDto,
  ) {
    return await this.taskService.findAll(claims, payload);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create task' })
  @ApiResponseConstruction({
    status: 201,
    description: 'Task created',
    model: Task,
  })
  @ApiBody({ type: CreateTaskDto })
  async create(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() payload: CreateTaskDto,
  ) {
    return await this.taskService.create(claims, payload);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Task details',
    model: Task,
  })
  @ApiParam({
    name: 'id',
    type: String,
  })
  async findOne(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ) {
    return await this.taskService.findOne(claims, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Task updated',
    model: Task,
  })
  @ApiParam({
    name: 'id',
    type: String,
  })
  async update(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
    @Body() payload: UpdateTaskDto,
  ) {
    return await this.taskService.update(claims, id, payload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task' })
  @ApiResponseConstruction({
    status: 204,
    description: 'Task deleted',
    model: Task,
  })
  @ApiParam({
    name: 'id',
    type: String,
  })
  async delete(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ) {
    return await this.taskService.delete(claims, id);
  }

  @Put(':id/approve')
  @ApiOperation({ summary: 'Approve task' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Task approved',
    model: Task,
  })
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiBody({ type: ApproveTaskDto })
  async approve(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
    @Body() payload: ApproveTaskDto,
  ) {
    return await this.taskService.approve(claims, id, payload);
  }

  @Put(':id/reject')
  @ApiOperation({ summary: 'Reject task' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Task rejected',
    model: Task,
  })
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiBody({ type: RejectTaskDto })
  async reject(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
    @Body() payload: RejectTaskDto,
  ) {
    return await this.taskService.reject(claims, id, payload);
  }

  @Put(':id/start')
  @ApiOperation({ summary: 'Start task' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Task started',
    model: Task,
  })
  @ApiParam({
    name: 'id',
    type: String,
  })
  async start(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ) {
    return await this.taskService.start(claims, id);
  }

  @Put(':id/complete')
  @ApiOperation({ summary: 'Complete task' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Task completed',
    model: Task,
  })
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiBody({ type: CompleteTaskDto })
  async complete(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
    @Body() payload: CompleteTaskDto,
  ) {
    return await this.taskService.complete(claims, id, payload);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel task' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Task canceled',
    model: Task,
  })
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiBody({ type: CancelTaskDto })
  async cancel(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
    @Body() payload: CancelTaskDto,
  ) {
    return await this.taskService.cancel(claims, id, payload);
  }

  @Get(':id/proofs')
  @ApiOperation({ summary: 'Get task proofs' })
  @ApiResponseConstruction({
    status: 200,
    description: 'List of proofs',
    model: TaskProof,
    isArray: true,
  })
  @ApiParam({
    name: 'id',
    type: String,
  })
  async findProofs(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
    @Query() payload: FilterTaskProofDto,
  ) {
    return await this.taskProofService.findByTask(claims, id, payload);
  }

  @Post(':id/proofs')
  @ApiOperation({ summary: 'Create task proof' })
  @ApiResponseConstruction({
    status: 201,
    description: 'Proof created',
    model: TaskProof,
  })
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiBody({ type: CreateTaskProofDto })
  async createProof(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
    @Body() payload: CreateTaskProofDto,
  ) {
    return await this.taskProofService.create(claims, id, payload);
  }

  @Post(':id/proofs/bulk')
  @ApiOperation({ summary: 'Create multiple task proofs at once' })
  @ApiResponseConstruction({
    status: 201,
    description: 'Proofs created successfully',
    model: TaskProof,
    isArray: true,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Task ID',
  })
  @ApiBody({ type: BulkCreateTaskProofDto })
  async createBulkProofs(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') taskId: string,
    @Body() payload: BulkCreateTaskProofDto,
  ) {
    // Ensure the taskId in the URL matches the one in the payload
    payload.taskId = taskId;
    return await this.taskProofService.createBulk(claims, payload);
  }

  @Post(':id/files/upload')
  @ApiOperation({ summary: 'Upload a single file for a task' })
  @ApiConsumes('multipart/form-data')
  @ApiResponseConstruction({
    status: 201,
    description: 'File uploaded successfully',
    model: FileUploadResponseDto,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Task ID',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        description: {
          type: 'string',
          description: 'Optional file description',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB max - let task service handle actual validation
    },
  }))
  async uploadFile(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') taskId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: FileUploadDto,
  ) {
    return await this.taskService.uploadFile(claims, taskId, file, dto);
  }

  @Post(':id/files/upload-multiple')
  @ApiOperation({ summary: 'Upload multiple files for a task' })
  @ApiConsumes('multipart/form-data')
  @ApiResponseConstruction({
    status: 201,
    description: 'Files uploaded successfully',
    model: FileUploadResponseDto,
    isArray: true,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Task ID',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        description: {
          type: 'string',
          description: 'Optional files description',
        },
      },
      required: ['files'],
    },
  })
  @UseInterceptors(FilesInterceptor('files', 20, {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB per file max - let task service handle actual validation
    },
  }))
  async uploadMultipleFiles(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') taskId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: BulkFileUploadDto,
  ) {
    return await this.taskService.uploadMultipleFiles(claims, taskId, files, dto);
  }

  @Get(':id/files')
  @ApiOperation({ summary: 'List all files for a task' })
  @ApiResponseConstruction({
    status: 200,
    description: 'List of task files',
    isArray: true,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Task ID',
  })
  async listTaskFiles(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') taskId: string,
  ) {
    return await this.taskService.listTaskFiles(claims, taskId);
  }

  @Delete('files/:fileName')
  @ApiOperation({ summary: 'Delete a file' })
  @ApiResponseConstruction({
    status: 200,
    description: 'File deleted successfully',
  })
  @ApiParam({
    name: 'fileName',
    type: String,
    description: 'File name to delete',
  })
  async deleteFile(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('fileName') fileName: string,
  ) {
    return await this.taskService.deleteFile(claims, fileName);
  }

  @Get('files/:fileName/signed-url')
  @ApiOperation({ summary: 'Get a signed URL for file download' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Signed URL generated',
  })
  @ApiParam({
    name: 'fileName',
    type: String,
    description: 'File name',
  })
  @ApiParam({
    name: 'expiresInMinutes',
    type: Number,
    required: false,
    description: 'URL expiration time in minutes (default: 60)',
  })
  async getSignedUrl(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('fileName') fileName: string,
    @Query('expiresInMinutes') expiresInMinutes?: number,
  ) {
    return await this.taskService.getSignedUrl(claims, fileName, expiresInMinutes);
  }
}
