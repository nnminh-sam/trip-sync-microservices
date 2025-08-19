import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATSClient } from 'src/client/clients';
import { NatsClientSender } from 'src/utils';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { ReportMessagePattern } from './report-message.pattern';
import { FilterReportTripDto } from './dtos/filter-report-trip.dto';
import { FilterReportTaskDto } from './dtos/filter-report-task.dto';
import { TaskReportDto, FilterTaskReportDto } from './dtos/task-report.dto';
import { LocationPointDto, CheckInOutDto, FilterLocationReportDto } from './dtos/location-report.dto';
import { ExportRequestDto } from './dtos/export-config.dto';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);
  private readonly sender: NatsClientSender<typeof ReportMessagePattern>;

  constructor(
    @Inject(NATSClient.name)
    private readonly natsClient: ClientProxy,
  ) {
    this.sender = new NatsClientSender(natsClient, ReportMessagePattern);
  }

  // Trip and Task Summary Reports
  async getTripSummary(claims: TokenClaimsDto, filter: FilterReportTripDto) {
    this.logger.log('Getting trip summary report');
    try {
      const result = await this.sender.send({
        messagePattern: 'tripSummary',
        payload: { claims, request: { body: filter } },
      });
      return result;
    } catch (error) {
      this.logger.error('Failed to get trip summary', error.stack);
      throw error;
    }
  }

  async getTaskSummary(claims: TokenClaimsDto, filter: FilterReportTaskDto) {
    this.logger.log('Getting task summary report');
    try {
      const result = await this.sender.send({
        messagePattern: 'taskCompletion',
        payload: { claims, request: { body: filter } },
      });
      return result;
    } catch (error) {
      this.logger.error('Failed to get task summary', error.stack);
      throw error;
    }
  }

  // Detailed Task Reports
  async getDetailedTaskReport(claims: TokenClaimsDto, filter: FilterTaskReportDto) {
    this.logger.log('Getting detailed task report');
    try {
      const result = await this.sender.send({
        messagePattern: 'taskDetailed',
        payload: { claims, request: { body: filter } },
      });
      return result;
    } catch (error) {
      this.logger.error('Failed to get detailed task report', error.stack);
      throw error;
    }
  }

  async submitTaskReport(claims: TokenClaimsDto, report: TaskReportDto) {
    this.logger.log(`Submitting task report for task ${report.task_id}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'taskSubmit',
        payload: { claims, request: { body: report } },
      });
      return result;
    } catch (error) {
      this.logger.error(`Failed to submit task report`, error.stack);
      throw error;
    }
  }

  // Location Tracking
  async trackLocation(claims: TokenClaimsDto, data: { employee_id: string; trip_id: string } & LocationPointDto) {
    this.logger.log(`Tracking location for employee ${data.employee_id}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'locationTrack',
        payload: { claims, request: { body: data } },
      });
      return result;
    } catch (error) {
      this.logger.error('Failed to track location', error.stack);
      throw error;
    }
  }

  async getLocationHistory(claims: TokenClaimsDto, filter: FilterLocationReportDto) {
    this.logger.log('Getting location history');
    try {
      const result = await this.sender.send({
        messagePattern: 'locationHistory',
        payload: { claims, request: { body: filter } },
      });
      return result;
    } catch (error) {
      this.logger.error('Failed to get location history', error.stack);
      throw error;
    }
  }

  async recordCheckIn(claims: TokenClaimsDto, data: { employee_id: string; trip_id: string } & CheckInOutDto) {
    this.logger.log(`Recording check-in for employee ${data.employee_id}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'locationCheckIn',
        payload: { claims, request: { body: data } },
      });
      return result;
    } catch (error) {
      this.logger.error('Failed to record check-in', error.stack);
      throw error;
    }
  }

  async recordCheckOut(claims: TokenClaimsDto, data: { employee_id: string; trip_id: string } & CheckInOutDto) {
    this.logger.log(`Recording check-out for employee ${data.employee_id}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'locationCheckOut',
        payload: { claims, request: { body: data } },
      });
      return result;
    } catch (error) {
      this.logger.error('Failed to record check-out', error.stack);
      throw error;
    }
  }

  // Export Reports
  async exportTripReport(claims: TokenClaimsDto, request: ExportRequestDto) {
    this.logger.log('Exporting trip report');
    try {
      const result = await this.sender.send({
        messagePattern: 'exportTrips',
        payload: { claims, request: { body: request } },
      });
      return result;
    } catch (error) {
      this.logger.error('Failed to export trip report', error.stack);
      throw error;
    }
  }

  async exportTaskReport(claims: TokenClaimsDto, request: ExportRequestDto) {
    this.logger.log('Exporting task report');
    try {
      const result = await this.sender.send({
        messagePattern: 'exportTasks',
        payload: { claims, request: { body: request } },
      });
      return result;
    } catch (error) {
      this.logger.error('Failed to export task report', error.stack);
      throw error;
    }
  }

  // Dashboard and Analytics
  async getDashboardSummary(claims: TokenClaimsDto, params?: any) {
    this.logger.log('Getting dashboard summary');
    try {
      const result = await this.sender.send({
        messagePattern: 'dashboardSummary',
        payload: { claims, request: { body: params || {} } },
      });
      return result;
    } catch (error) {
      this.logger.error('Failed to get dashboard summary', error.stack);
      throw error;
    }
  }

  async getPerformanceMetrics(claims: TokenClaimsDto, params?: any) {
    this.logger.log('Getting performance metrics');
    try {
      const result = await this.sender.send({
        messagePattern: 'dashboardPerformance',
        payload: { claims, request: { body: params || {} } },
      });
      return result;
    } catch (error) {
      this.logger.error('Failed to get performance metrics', error.stack);
      throw error;
    }
  }
}
