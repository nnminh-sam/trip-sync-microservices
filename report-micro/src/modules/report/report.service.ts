import { Injectable, Logger } from '@nestjs/common';
import { TripClient} from '../../client/trip.client'
import { FilterReportTripDto } from './dtos/filter-report-trip.dto';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { FilterTripDto } from '../../dtos/filter-trip.dto';
import { TaskClient } from 'src/client/task.client';
import { FilterReportTaskDto } from './dtos/filter-report-task.dto';
import { FilterTaskDto } from 'src/dtos/filter-task.dto';
import { TaskReportDto, FilterTaskReportDto } from './dtos/task-report.dto';
import { LocationPointDto, CheckInOutDto, FilterLocationReportDto } from './dtos/location-report.dto';
import { ExportRequestDto, GroupByOption } from './dtos/export-config.dto';
import { MediaHandlerService } from './services/media-handler.service';
import { ExportService } from './services/export.service';
import { LocationTrackingService } from './services/location-tracking.service';
import { ReportAggregationService } from './services/report-aggregation.service';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    private readonly tripClient: TripClient,
    private readonly taskClient: TaskClient,
    private readonly mediaHandler: MediaHandlerService,
    private readonly exportService: ExportService,
    private readonly locationTracking: LocationTrackingService,
    private readonly aggregationService: ReportAggregationService
  ) {}

  async getTripSummary(claims: TokenClaimsDto, filter: FilterReportTripDto) {
  this.logger.log('Generating trip summary report');
  this.logger.debug(`Calling tripClient.findAll with filter: ${JSON.stringify(filter)}`);

  const tripFilter: FilterTripDto = {
    from_date: filter.from_date,
    to_date: filter.to_date,
    status: filter.status,
    assignee_id: filter.assignee_id,
    created_by: filter.created_by
  };

  try {
    const response = await this.tripClient.findAll(claims, tripFilter);
    this.logger.log(`Trip summary retrieved with ${response?.data?.length ?? 0} records`);
    return response?.data ?? [];
  } catch (error) {
    this.logger.error('Error while getting trip summary:', error.stack);
    throw error;
  }
}

  async getTaskSummary(claims: TokenClaimsDto, filter: FilterReportTaskDto) {
    this.logger.log('Generating task summary report');
    this.logger.debug(`Calling taskClient.findAll with filter: ${JSON.stringify(filter)}`);

    const taskFilter: FilterTaskDto = {
      created_at_from: filter.created_at_from,
      created_at_to: filter.created_at_to,
      completed_at_from: filter.completed_at_from,
      completed_at_to: filter.completed_at_to,
      status: filter.status,
      trip_id: filter.trip_id
    };

    try {
      const response = await this.taskClient.findAll(claims, taskFilter);
      this.logger.log(`Task summary retrieved with ${response?.data?.length ?? 0} records`);
      return response?.data ?? [];
    } catch (error) {
      this.logger.error('Error while getting task summary:', error.stack);
      throw error;
    }
  }

  // New Task Report Methods
  async getDetailedTaskReport(claims: TokenClaimsDto, filter: FilterTaskReportDto) {
    this.logger.log('Getting detailed task report');
    // Implementation would fetch detailed task data with evidence
    return { message: 'Detailed task report', filter };
  }

  async submitTaskReport(claims: TokenClaimsDto, report: TaskReportDto) {
    this.logger.log(`Submitting task report for task ${report.task_id}`);
    // Implementation would save the report and process evidence
    return { message: 'Task report submitted', task_id: report.task_id };
  }

  async attachTaskEvidence(claims: TokenClaimsDto, taskId: string, evidence: any[]) {
    this.logger.log(`Attaching evidence to task ${taskId}`);
    // Implementation would process and store evidence files
    return { message: 'Evidence attached', task_id: taskId, count: evidence.length };
  }

  // Location Tracking Methods
  async trackLocation(claims: TokenClaimsDto, employeeId: string, tripId: string, location: LocationPointDto) {
    this.logger.log(`Tracking location for employee ${employeeId} on trip ${tripId}`);
    await this.locationTracking.trackLocation(employeeId, tripId, location);
    return { message: 'Location tracked successfully' };
  }

  async getLocationHistory(claims: TokenClaimsDto, filter: FilterLocationReportDto) {
    this.logger.log('Getting location history');
    const history = await this.locationTracking.getLocationHistory(
      filter.trip_id || '',
      filter.employee_id
    );
    return history;
  }

  async getLiveLocations(claims: TokenClaimsDto, tripIds: string[]) {
    this.logger.log(`Getting live locations for ${tripIds.length} trips`);
    const locations = await this.locationTracking.getLiveLocations(tripIds);
    return Array.from(locations.entries()).map(([key, location]) => ({
      key,
      location
    }));
  }

  async recordCheckIn(claims: TokenClaimsDto, employeeId: string, tripId: string, checkIn: CheckInOutDto) {
    this.logger.log(`Recording check-in for employee ${employeeId} on trip ${tripId}`);
    await this.locationTracking.recordCheckIn(employeeId, tripId, checkIn);
    return { message: 'Check-in recorded successfully' };
  }

  async recordCheckOut(claims: TokenClaimsDto, employeeId: string, tripId: string, checkOut: CheckInOutDto) {
    this.logger.log(`Recording check-out for employee ${employeeId} on trip ${tripId}`);
    await this.locationTracking.recordCheckOut(employeeId, tripId, checkOut);
    return { message: 'Check-out recorded successfully' };
  }

  // Export Methods
  async exportTripReport(claims: TokenClaimsDto, request: ExportRequestDto) {
    this.logger.log('Exporting trip report');
    const trips = await this.getTripSummary(claims, request.filters || {});
    const filePath = await this.exportService.exportTripReport(trips, request.config);
    return { file_path: filePath, format: request.config.format };
  }

  async exportTaskReport(claims: TokenClaimsDto, request: ExportRequestDto) {
    this.logger.log('Exporting task report');
    const tasks = await this.getTaskSummary(claims, request.filters || {});
    const filePath = await this.exportService.exportTaskReport(tasks, request.config);
    return { file_path: filePath, format: request.config.format };
  }

  async exportAggregateReport(claims: TokenClaimsDto, request: ExportRequestDto) {
    this.logger.log('Exporting aggregate report');
    // Implementation would generate aggregated data and export
    return { message: 'Aggregate report exported', config: request.config };
  }

  // Dashboard Methods
  async getDashboardSummary(claims: TokenClaimsDto, params: any) {
    this.logger.log('Getting dashboard summary');
    const trips = await this.getTripSummary(claims, {});
    const tasks = await this.getTaskSummary(claims, {});
    const employees = []; // Would fetch from user service
    
    const summary = await this.aggregationService.generateDashboardSummary(
      trips,
      tasks,
      employees
    );
    return summary;
  }

  async getPerformanceMetrics(claims: TokenClaimsDto, params: any) {
    this.logger.log('Getting performance metrics');
    const trips = await this.getTripSummary(claims, {});
    const tasks = await this.getTaskSummary(claims, {});
    
    const metrics = await this.aggregationService.calculatePerformanceMetrics(
      params.employee_id,
      trips,
      tasks,
      params.date_range || { from: new Date().toISOString(), to: new Date().toISOString() }
    );
    return metrics;
  }

  // Aggregation Methods
  async aggregateTripData(claims: TokenClaimsDto, request: ExportRequestDto) {
    this.logger.log('Aggregating trip data');
    const trips = await this.getTripSummary(claims, request.filters || {});
    const aggregated = await this.aggregationService.aggregateTripData(
      trips,
      request.config.group_by || GroupByOption.MONTH,
      request.config.date_range
    );
    return aggregated;
  }

  async aggregateTaskData(claims: TokenClaimsDto, request: ExportRequestDto) {
    this.logger.log('Aggregating task data');
    const tasks = await this.getTaskSummary(claims, request.filters || {});
    const aggregated = await this.aggregationService.aggregateTaskData(
      tasks,
      request.config.group_by || GroupByOption.MONTH,
      request.config.date_range
    );
    return aggregated;
  }
}
