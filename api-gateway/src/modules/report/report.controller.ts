import { Controller, Get, Post, Body, Query, Param, Response } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { ApiResponseConstruction } from 'src/common/decorators/api-response-construction.decorator';
import { RequestUserClaims } from 'src/common/decorators/request-user-claims.decorator';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { ReportService } from './report.service';
import { FilterReportTripDto } from './dtos/filter-report-trip.dto';
import { FilterReportTaskDto } from './dtos/filter-report-task.dto';
import { TaskReportDto, FilterTaskReportDto } from './dtos/task-report.dto';
import { LocationPointDto, CheckInOutDto, FilterLocationReportDto } from './dtos/location-report.dto';
import { ExportRequestDto } from './dtos/export-config.dto';

@ApiBearerAuth()
@ApiTags('Reports')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  // Summary Reports
  @Get('trips/summary')
  @ApiOperation({ summary: 'Get trip summary report' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Trip summary report retrieved',
    isArray: true,
  })
  async getTripSummary(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Query() filter: FilterReportTripDto,
  ) {
    return this.reportService.getTripSummary(claims, filter);
  }

  @Get('tasks/summary')
  @ApiOperation({ summary: 'Get task summary report' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Task summary report retrieved',
    isArray: true,
  })
  async getTaskSummary(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Query() filter: FilterReportTaskDto,
  ) {
    return this.reportService.getTaskSummary(claims, filter);
  }

  // Detailed Task Reports
  @Get('tasks/detailed')
  @ApiOperation({ summary: 'Get detailed task report' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Detailed task report retrieved',
    isArray: true,
  })
  async getDetailedTaskReport(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Query() filter: FilterTaskReportDto,
  ) {
    return this.reportService.getDetailedTaskReport(claims, filter);
  }

  @Post('tasks/submit')
  @ApiOperation({ summary: 'Submit task report with evidence' })
  @ApiBody({ type: TaskReportDto })
  @ApiResponseConstruction({
    status: 201,
    description: 'Task report submitted',
  })
  async submitTaskReport(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() report: TaskReportDto,
  ) {
    return this.reportService.submitTaskReport(claims, report);
  }

  // Location Tracking
  @Post('location/track')
  @ApiOperation({ summary: 'Track employee location' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        employee_id: { type: 'string' },
        trip_id: { type: 'string' },
        lat: { type: 'number' },
        lng: { type: 'number' },
        timestamp: { type: 'string' },
        activity: { type: 'string' },
      },
      required: ['employee_id', 'trip_id', 'lat', 'lng', 'timestamp'],
    }
  })
  @ApiResponseConstruction({
    status: 200,
    description: 'Location tracked',
  })
  async trackLocation(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() data: { employee_id: string; trip_id: string } & LocationPointDto,
  ) {
    return this.reportService.trackLocation(claims, data);
  }

  @Get('location/history')
  @ApiOperation({ summary: 'Get location history' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Location history retrieved',
    isArray: true,
  })
  async getLocationHistory(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Query() filter: FilterLocationReportDto,
  ) {
    return this.reportService.getLocationHistory(claims, filter);
  }

  @Post('location/check-in')
  @ApiOperation({ summary: 'Record check-in' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        employee_id: { type: 'string' },
        trip_id: { type: 'string' },
        lat: { type: 'number' },
        lng: { type: 'number' },
        timestamp: { type: 'string' },
      },
      required: ['employee_id', 'trip_id', 'lat', 'lng', 'timestamp'],
    }
  })
  @ApiResponseConstruction({
    status: 200,
    description: 'Check-in recorded',
  })
  async recordCheckIn(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() data: { employee_id: string; trip_id: string } & CheckInOutDto,
  ) {
    return this.reportService.recordCheckIn(claims, data);
  }

  @Post('location/check-out')
  @ApiOperation({ summary: 'Record check-out' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        employee_id: { type: 'string' },
        trip_id: { type: 'string' },
        lat: { type: 'number' },
        lng: { type: 'number' },
        timestamp: { type: 'string' },
      },
      required: ['employee_id', 'trip_id', 'lat', 'lng', 'timestamp'],
    }
  })
  @ApiResponseConstruction({
    status: 200,
    description: 'Check-out recorded',
  })
  async recordCheckOut(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() data: { employee_id: string; trip_id: string } & CheckInOutDto,
  ) {
    return this.reportService.recordCheckOut(claims, data);
  }

  // Export Reports
  @Post('export/trips')
  @ApiOperation({ summary: 'Export trip report to CSV/Excel' })
  @ApiBody({ type: ExportRequestDto })
  @ApiResponseConstruction({
    status: 200,
    description: 'Trip report exported',
  })
  async exportTripReport(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() request: ExportRequestDto,
  ) {
    return this.reportService.exportTripReport(claims, request);
  }

  @Post('export/tasks')
  @ApiOperation({ summary: 'Export task report to CSV/Excel' })
  @ApiBody({ type: ExportRequestDto })
  @ApiResponseConstruction({
    status: 200,
    description: 'Task report exported',
  })
  async exportTaskReport(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() request: ExportRequestDto,
  ) {
    return this.reportService.exportTaskReport(claims, request);
  }

  // Dashboard
  @Get('dashboard/summary')
  @ApiOperation({ summary: 'Get dashboard summary' })
  @ApiQuery({ name: 'from_date', required: false })
  @ApiQuery({ name: 'to_date', required: false })
  @ApiResponseConstruction({
    status: 200,
    description: 'Dashboard summary retrieved',
  })
  async getDashboardSummary(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Query('from_date') fromDate?: string,
    @Query('to_date') toDate?: string,
  ) {
    return this.reportService.getDashboardSummary(claims, {
      date_range: fromDate && toDate ? { from: fromDate, to: toDate } : undefined,
    });
  }

  @Get('dashboard/performance')
  @ApiOperation({ summary: 'Get performance metrics' })
  @ApiQuery({ name: 'employee_id', required: false })
  @ApiQuery({ name: 'from_date', required: false })
  @ApiQuery({ name: 'to_date', required: false })
  @ApiResponseConstruction({
    status: 200,
    description: 'Performance metrics retrieved',
  })
  async getPerformanceMetrics(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Query('employee_id') employeeId?: string,
    @Query('from_date') fromDate?: string,
    @Query('to_date') toDate?: string,
  ) {
    return this.reportService.getPerformanceMetrics(claims, {
      employee_id: employeeId,
      date_range: fromDate && toDate ? { from: fromDate, to: toDate } : undefined,
    });
  }
}