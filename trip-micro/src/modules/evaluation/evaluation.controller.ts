import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EvaluationService } from './evaluation.service';
import { CreateEvaluationDto } from './dtos/create-evaluation.dto';
import { FilterEvaluationDto } from './dtos/filter-evaluation.dto';
import { EvaluationMessagePattern } from './evaluation-message.pattern';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';
import { throwRpcException } from 'src/utils';

@Controller()
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @MessagePattern(EvaluationMessagePattern.CREATE)
  async create(@Payload() payload: MessagePayloadDto<CreateEvaluationDto>) {
    await this.evaluationService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['manager', 'system admin'],
        permission: {
          action: 'create',
          resource: 'evaluation',
        },
      },
    });

    const userId = payload.claims.sub;
    return await this.evaluationService.create(userId, payload.request.body);
  }

  @MessagePattern(EvaluationMessagePattern.FIND_ALL)
  async findAll(@Payload() payload: MessagePayloadDto<FilterEvaluationDto>) {
    await this.evaluationService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin', 'manager', 'employee'],
        permission: {
          action: 'read',
          resource: 'evaluation',
        },
      },
    });

    return await this.evaluationService.findAll(payload.request.body);
  }

  @MessagePattern(EvaluationMessagePattern.FIND_ONE)
  async findOne(@Payload() payload: MessagePayloadDto) {
    await this.evaluationService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin', 'manager', 'employee'],
        permission: {
          action: 'read',
          resource: 'evaluation',
        },
      },
    });

    const { id } = payload.request.path;
    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Evaluation ID is required',
      });
    }

    return await this.evaluationService.findOne(id);
  }
}
