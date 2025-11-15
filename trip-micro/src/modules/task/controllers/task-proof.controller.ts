import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';
import { CreateTaskProofDto } from 'src/modules/task/dtos/create-task-proof.dto';
import { FilterTaskProofDto } from 'src/modules/task/dtos/filter-task-proof.dto';
import { ProofMessagePattern } from 'src/modules/task/proof-message.pattern';
import { TaskProofService } from 'src/modules/task/services/task-proof.service';

@Controller('task-proof')
export class TaskProofController {
  constructor(private readonly taskProofService: TaskProofService) {}

  @MessagePattern(ProofMessagePattern.create)
  async create(@Payload() payload: MessagePayloadDto<CreateTaskProofDto>) {
    const { taskId } = payload.request.path;
    const dto = payload.request.body;
    // TODO: Call User service for Authorization
    return await this.taskProofService.create(taskId, dto);
  }

  @MessagePattern(ProofMessagePattern.findByTask)
  async find(@Payload() payload: MessagePayloadDto<FilterTaskProofDto>) {
    const { taskId } = payload.request.path;
    const dto = payload.request.body;
    // TODO: Call User service for Authorization
    return await this.taskProofService.find(taskId, dto);
  }

  @MessagePattern(ProofMessagePattern.findOne)
  async findOne(@Payload() payload: MessagePayloadDto) {
    const { id } = payload.request.path;
    // TODO: Call User service for Authorization
    return await this.taskProofService.findOne(id);
  }

  @MessagePattern(ProofMessagePattern.delete)
  async delete(@Payload() payload: MessagePayloadDto) {
    const { id } = payload.request.path;
    // TODO: Call User service for Authorization
    return await this.taskProofService.delete(id);
  }
}
