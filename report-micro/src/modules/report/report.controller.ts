import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';
import { ReportService } from './report.service';
import { ReportMessagePattern } from './report-message.pattern';
import { FilterReportDto } from './dtos/filter-report.dto';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @MessagePattern(ReportMessagePattern.TRIP_SUMMARY)
    async generateTripSummary(@Payload() payload: MessagePayloadDto<FilterReportDto>) {
      const { claims, request } = payload;
      return this.reportService.getTripSummary(claims, request.body);
}


  @MessagePattern(ReportMessagePattern.TASK_COMPLETION)
  async generateTaskCompletion(@Payload() payload: MessagePayloadDto<FilterReportDto>) {
    const { claims, request } = payload;
    return this.reportService.getTaskCompletion(claims, request.body);
  }
}
