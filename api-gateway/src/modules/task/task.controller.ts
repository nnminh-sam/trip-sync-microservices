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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
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
import { RequestTaskCancelDto } from 'src/modules/task/dtos/request-task-cancel.dto';
import { ResolveTaskCancelationDto } from 'src/modules/task/dtos/resolve-task-cancelation.dto';
import {
  FileUploadDto,
  BulkFileUploadDto,
  FileUploadResponseDto,
} from 'src/modules/task/dtos/file-upload.dto';
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

  @Post(':id/cancelations/request')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request to cancel a task' })
  @ApiResponseConstruction({
    status: 201,
    description: 'Task cancellation request created',
  })
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiBody({ type: RequestTaskCancelDto })
  async requestCancel(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
    @Body() payload: RequestTaskCancelDto,
  ) {
    return await this.taskService.requestCancel(claims, id, payload);
  }

  @Post(':id/cancelations/resolve')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Resolve a task cancellation request' })
  @ApiResponseConstruction({
    status: 201,
    description: 'Task cancellation request resolved',
    model: Task,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Cancelation ID',
  })
  @ApiBody({ type: ResolveTaskCancelationDto })
  async resolveCancel(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
    @Body() payload: ResolveTaskCancelationDto,
  ) {
    return await this.taskService.resolveCancel(claims, id, payload);
  }

  @Get(':id/cancelations')
  @ApiOperation({ summary: 'Get task cancellation requests' })
  @ApiResponseConstruction({
    status: 200,
    description: 'List of task cancellation requests',
    isArray: true,
  })
  @ApiParam({
    name: 'id',
    type: String,
  })
  async getCancelationRequests(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ) {
    return await this.taskService.getCancelationRequests(claims, id);
  }
}
