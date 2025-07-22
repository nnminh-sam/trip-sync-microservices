import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponseConstruction } from 'src/common/decorators/api-response-construction.decorator';
import { RequestUserClaims } from 'src/common/decorators/request-user-claims.decorator';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { Task } from 'src/models/task.model';
import { CreateTaskProofDto } from 'src/modules/task-proof/dtos/create-task-proof.dto';
import { FilterTaskProofDto } from 'src/modules/task-proof/dtos/filter-task-proof.dto';
import { CreateTaskDto } from 'src/modules/task/dtos/create-task.dto';
import { FilterTaskDto } from 'src/modules/task/dtos/filter-task.dto';

@ApiBearerAuth()
@ApiTags('Task')
@Controller('tasks')
export class TaskController {
  constructor() {}

  @Get()
  @ApiOperation({ summary: 'List/Filter tasks' })
  @ApiResponseConstruction({
    status: 200,
    description: 'List of tasks',
    model: Task,
    isArray: true,
  })
  @ApiBody({ type: FilterTaskDto })
  async findAll(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() payload: FilterTaskDto,
  ) {
    return { claims, payload };
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
    return { claims, payload };
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
    return {
      claims,
      id,
    };
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
  ) {
    return {
      claims,
      id,
    };
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
    return {
      claims,
      id,
    };
  }

  @Get(':id/proofs')
  @ApiOperation({ summary: 'Get task proofs' })
  @ApiResponseConstruction({
    status: 200,
    description: 'List of proofs',
    model: Task,
  })
  @ApiParam({
    name: 'id',
    type: String,
  })
  async findProofs(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() payload: FilterTaskProofDto,
  ) {
    return {
      claims,
      payload,
    };
  }

  @Post(':id/proofs')
  @ApiOperation({ summary: 'Create task proof' })
  @ApiResponseConstruction({
    status: 201,
    description: 'Proof created',
    model: Task,
  })
  @ApiParam({
    name: 'id',
    type: String,
  })
  async createProof(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() payload: CreateTaskProofDto,
  ) {
    return {
      claims,
      payload,
    };
  }
}
