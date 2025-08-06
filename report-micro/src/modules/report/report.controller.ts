import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';
import { ReportService } from './report.service';
import { ReportMessagePattern } from './report-message.pattern';
import { FilterReportTripDto } from './dtos/filter-report-trip.dto';
import { FilterReportTaskDto } from './dtos/filter-report-task.dto';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @MessagePattern(ReportMessagePattern.TRIP_SUMMARY)
    async generateTripSummary(@Payload() payload: MessagePayloadDto<FilterReportTripDto>) {
      const { claims, request } = payload;
      return this.reportService.getTripSummary(claims, request.body);
}

  @MessagePattern(ReportMessagePattern.TASK_COMPLETION)
      async generateTaskSummary(@Payload() payload: MessagePayloadDto<FilterReportTaskDto>) {
        const { claims, request } = payload;
        return this.reportService.getTaskSummary(claims, request.body);
  }

}
