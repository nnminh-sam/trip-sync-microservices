import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';
import { ExportService } from './export.service';
import { CreateExportDto } from './dtos/create-export.dto';
import { ExportMessagePattern } from './export-message.pattern';
import { throwRpcException } from 'src/utils';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @MessagePattern(ExportMessagePattern.CREATE)
  async create(@Payload() payload: MessagePayloadDto<CreateExportDto>) {
    return await this.exportService.createExportRequest(payload.request.body);
  }


  @MessagePattern(ExportMessagePattern.FIND_ONE)
  async findOne(@Payload() payload: MessagePayloadDto) {
    const { id } = payload.request.path;
    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required export ID',
      });
    }
    return await this.exportService.findOne(id);
  }


}
