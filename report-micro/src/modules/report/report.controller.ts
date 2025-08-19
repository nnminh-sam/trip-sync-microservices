import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';
import { ReportService } from './report.service';
import { ReportMessagePattern } from './report-message.pattern';
import { FilterReportTripDto } from './dtos/filter-report-trip.dto';
import { FilterReportTaskDto } from './dtos/filter-report-task.dto';
import { TaskReportDto, FilterTaskReportDto } from './dtos/task-report.dto';
import { LocationReportDto, FilterLocationReportDto, LocationPointDto, CheckInOutDto } from './dtos/location-report.dto';
import { ExportRequestDto } from './dtos/export-config.dto';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  // Existing endpoints
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

  // Task Report endpoints
  @MessagePattern(ReportMessagePattern.TASK_DETAILED)
  async getDetailedTaskReport(@Payload() payload: MessagePayloadDto<FilterTaskReportDto>) {
    const { claims, request } = payload;
    return this.reportService.getDetailedTaskReport(claims, request.body);
  }

  @MessagePattern(ReportMessagePattern.TASK_SUBMIT)
  async submitTaskReport(@Payload() payload: MessagePayloadDto<TaskReportDto>) {
    const { claims, request } = payload;
    return this.reportService.submitTaskReport(claims, request.body);
  }

  @MessagePattern(ReportMessagePattern.TASK_EVIDENCE)
  async attachEvidence(@Payload() payload: MessagePayloadDto<{ task_id: string; evidence: any[] }>) {
    const { claims, request } = payload;
    return this.reportService.attachTaskEvidence(claims, request.body.task_id, request.body.evidence);
  }

  // Location Report endpoints
  @MessagePattern(ReportMessagePattern.LOCATION_TRACK)
  async trackLocation(@Payload() payload: MessagePayloadDto<LocationPointDto & { employee_id: string; trip_id: string }>) {
    const { claims, request } = payload;
    const { employee_id, trip_id, ...location } = request.body;
    return this.reportService.trackLocation(claims, employee_id, trip_id, location);
  }

  @MessagePattern(ReportMessagePattern.LOCATION_HISTORY)
  async getLocationHistory(@Payload() payload: MessagePayloadDto<FilterLocationReportDto>) {
    const { claims, request } = payload;
    return this.reportService.getLocationHistory(claims, request.body);
  }

  @MessagePattern(ReportMessagePattern.LOCATION_LIVE)
  async getLiveLocations(@Payload() payload: MessagePayloadDto<{ trip_ids: string[] }>) {
    const { claims, request } = payload;
    return this.reportService.getLiveLocations(claims, request.body.trip_ids);
  }

  @MessagePattern(ReportMessagePattern.LOCATION_CHECK_IN)
  async recordCheckIn(@Payload() payload: MessagePayloadDto<CheckInOutDto & { employee_id: string; trip_id: string }>) {
    const { claims, request } = payload;
    const { employee_id, trip_id, ...checkIn } = request.body;
    return this.reportService.recordCheckIn(claims, employee_id, trip_id, checkIn);
  }

  @MessagePattern(ReportMessagePattern.LOCATION_CHECK_OUT)
  async recordCheckOut(@Payload() payload: MessagePayloadDto<CheckInOutDto & { employee_id: string; trip_id: string }>) {
    const { claims, request } = payload;
    const { employee_id, trip_id, ...checkOut } = request.body;
    return this.reportService.recordCheckOut(claims, employee_id, trip_id, checkOut);
  }

  // Export endpoints
  @MessagePattern(ReportMessagePattern.EXPORT_TRIPS)
  async exportTripReport(@Payload() payload: MessagePayloadDto<ExportRequestDto>) {
    const { claims, request } = payload;
    return this.reportService.exportTripReport(claims, request.body);
  }

  @MessagePattern(ReportMessagePattern.EXPORT_TASKS)
  async exportTaskReport(@Payload() payload: MessagePayloadDto<ExportRequestDto>) {
    const { claims, request } = payload;
    return this.reportService.exportTaskReport(claims, request.body);
  }

  @MessagePattern(ReportMessagePattern.EXPORT_AGGREGATE)
  async exportAggregateReport(@Payload() payload: MessagePayloadDto<ExportRequestDto>) {
    const { claims, request } = payload;
    return this.reportService.exportAggregateReport(claims, request.body);
  }

  // Dashboard endpoints
  @MessagePattern(ReportMessagePattern.DASHBOARD_SUMMARY)
  async getDashboardSummary(@Payload() payload: MessagePayloadDto<{ date_range?: any; filters?: any }>) {
    const { claims, request } = payload;
    return this.reportService.getDashboardSummary(claims, request.body);
  }

  @MessagePattern(ReportMessagePattern.DASHBOARD_PERFORMANCE)
  async getPerformanceMetrics(@Payload() payload: MessagePayloadDto<{ employee_id?: string; date_range?: any }>) {
    const { claims, request } = payload;
    return this.reportService.getPerformanceMetrics(claims, request.body);
  }

  // Aggregation endpoints
  @MessagePattern(ReportMessagePattern.AGGREGATE_TRIPS)
  async aggregateTripData(@Payload() payload: MessagePayloadDto<ExportRequestDto>) {
    const { claims, request } = payload;
    return this.reportService.aggregateTripData(claims, request.body);
  }

  @MessagePattern(ReportMessagePattern.AGGREGATE_TASKS)
  async aggregateTaskData(@Payload() payload: MessagePayloadDto<ExportRequestDto>) {
    const { claims, request } = payload;
    return this.reportService.aggregateTaskData(claims, request.body);
  }

}
