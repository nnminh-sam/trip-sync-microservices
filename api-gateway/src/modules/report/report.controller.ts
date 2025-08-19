import { Controller, Get, Post, Body, Query, Param, Response } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Get detailed task report with evidence and objectives' })
  @ApiQuery({ name: 'task_id', required: false, description: 'Filter by task ID' })
  @ApiQuery({ name: 'trip_id', required: false, description: 'Filter by trip ID' })
  @ApiQuery({ name: 'employee_id', required: false, description: 'Filter by employee ID' })
  @ApiQuery({ name: 'from_date', required: false, description: 'Start date for filtering' })
  @ApiQuery({ name: 'to_date', required: false, description: 'End date for filtering' })
  @ApiQuery({ name: 'auto_submitted', required: false, description: 'Filter by auto-submission status' })
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
  @ApiOperation({ summary: 'Submit task report with evidence and objectives' })
  @ApiBody({ type: TaskReportDto })
  @ApiResponseConstruction({
    status: 201,
    description: 'Task report submitted successfully',
  })
  async submitTaskReport(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() report: TaskReportDto,
  ) {
    return this.reportService.submitTaskReport(claims, report);
  }

  @Post('tasks/:taskId/evidence')
  @ApiOperation({ summary: 'Attach additional evidence to an existing task report' })
  @ApiParam({ name: 'taskId', description: 'The task ID to attach evidence to' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        evidence: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['photo', 'video', 'document'] },
              url: { type: 'string' },
              description: { type: 'string' },
              location: {
                type: 'object',
                properties: {
                  lat: { type: 'number' },
                  lng: { type: 'number' },
                },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
            required: ['type', 'url'],
          },
        },
      },
      required: ['evidence'],
    },
  })
  @ApiResponseConstruction({
    status: 200,
    description: 'Evidence attached successfully',
  })
  async attachTaskEvidence(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('taskId') taskId: string,
    @Body() data: { evidence: any[] },
  ) {
    return this.reportService.attachTaskEvidence(claims, taskId, data.evidence);
  }

  // Location Tracking
  @Post('location/track')
  @ApiOperation({ summary: 'Track employee location during trip' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        employee_id: { type: 'string', description: 'Employee ID' },
        trip_id: { type: 'string', description: 'Trip ID' },
        lat: { type: 'number', description: 'Latitude' },
        lng: { type: 'number', description: 'Longitude' },
        timestamp: { type: 'string', format: 'date-time', description: 'Location timestamp' },
        activity: { type: 'string', description: 'Current activity (optional)' },
        accuracy: { type: 'number', description: 'GPS accuracy in meters (optional)' },
        speed: { type: 'number', description: 'Speed in km/h (optional)' },
      },
      required: ['employee_id', 'trip_id', 'lat', 'lng', 'timestamp'],
    }
  })
  @ApiResponseConstruction({
    status: 200,
    description: 'Location tracked successfully',
  })
  async trackLocation(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() data: { employee_id: string; trip_id: string } & LocationPointDto,
  ) {
    return this.reportService.trackLocation(claims, data);
  }

  @Get('location/history')
  @ApiOperation({ summary: 'Get location history for employees' })
  @ApiQuery({ name: 'employee_id', required: false, description: 'Filter by employee ID' })
  @ApiQuery({ name: 'trip_id', required: false, description: 'Filter by trip ID' })
  @ApiQuery({ name: 'from_date', required: false, description: 'Start date for filtering' })
  @ApiQuery({ name: 'to_date', required: false, description: 'End date for filtering' })
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

  @Post('location/live')
  @ApiOperation({ summary: 'Get live locations for multiple trips' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        trip_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of trip IDs to get live locations for',
        },
      },
      required: ['trip_ids'],
    },
  })
  @ApiResponseConstruction({
    status: 200,
    description: 'Live locations retrieved',
    isArray: true,
  })
  async getLiveLocations(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() data: { trip_ids: string[] },
  ) {
    return this.reportService.getLiveLocations(claims, data.trip_ids);
  }

  @Post('location/check-in')
  @ApiOperation({ summary: 'Record employee check-in at location' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        employee_id: { type: 'string', description: 'Employee ID' },
        trip_id: { type: 'string', description: 'Trip ID' },
        lat: { type: 'number', description: 'Check-in latitude' },
        lng: { type: 'number', description: 'Check-in longitude' },
        timestamp: { type: 'string', format: 'date-time', description: 'Check-in timestamp' },
        location_name: { type: 'string', description: 'Name of the location (optional)' },
        notes: { type: 'string', description: 'Check-in notes (optional)' },
      },
      required: ['employee_id', 'trip_id', 'lat', 'lng', 'timestamp'],
    }
  })
  @ApiResponseConstruction({
    status: 200,
    description: 'Check-in recorded successfully',
  })
  async recordCheckIn(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() data: { employee_id: string; trip_id: string } & CheckInOutDto,
  ) {
    return this.reportService.recordCheckIn(claims, data);
  }

  @Post('location/check-out')
  @ApiOperation({ summary: 'Record employee check-out from location' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        employee_id: { type: 'string', description: 'Employee ID' },
        trip_id: { type: 'string', description: 'Trip ID' },
        lat: { type: 'number', description: 'Check-out latitude' },
        lng: { type: 'number', description: 'Check-out longitude' },
        timestamp: { type: 'string', format: 'date-time', description: 'Check-out timestamp' },
        location_name: { type: 'string', description: 'Name of the location (optional)' },
        notes: { type: 'string', description: 'Check-out notes (optional)' },
      },
      required: ['employee_id', 'trip_id', 'lat', 'lng', 'timestamp'],
    }
  })
  @ApiResponseConstruction({
    status: 200,
    description: 'Check-out recorded successfully',
  })
  async recordCheckOut(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() data: { employee_id: string; trip_id: string } & CheckInOutDto,
  ) {
    return this.reportService.recordCheckOut(claims, data);
  }

  // Export Reports
  @Post('export/trips')
  @ApiOperation({ summary: 'Export trip reports to CSV/Excel format' })
  @ApiBody({ type: ExportRequestDto })
  @ApiResponseConstruction({
    status: 200,
    description: 'Trip report exported successfully',
  })
  async exportTripReport(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() request: ExportRequestDto,
  ) {
    return this.reportService.exportTripReport(claims, request);
  }

  @Post('export/tasks')
  @ApiOperation({ summary: 'Export task reports to CSV/Excel format' })
  @ApiBody({ type: ExportRequestDto })
  @ApiResponseConstruction({
    status: 200,
    description: 'Task report exported successfully',
  })
  async exportTaskReport(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() request: ExportRequestDto,
  ) {
    return this.reportService.exportTaskReport(claims, request);
  }

  @Post('export/aggregate')
  @ApiOperation({ summary: 'Export aggregated reports combining trips and tasks' })
  @ApiBody({ type: ExportRequestDto })
  @ApiResponseConstruction({
    status: 200,
    description: 'Aggregate report exported successfully',
  })
  async exportAggregateReport(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() request: ExportRequestDto,
  ) {
    return this.reportService.exportAggregateReport(claims, request);
  }

  // Dashboard
  @Get('dashboard/summary')
  @ApiOperation({ summary: 'Get comprehensive dashboard summary with key metrics' })
  @ApiQuery({ name: 'from_date', required: false, description: 'Start date for metrics calculation' })
  @ApiQuery({ name: 'to_date', required: false, description: 'End date for metrics calculation' })
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
  @ApiOperation({ summary: 'Get detailed performance metrics for employees' })
  @ApiQuery({ name: 'employee_id', required: false, description: 'Specific employee ID (optional)' })
  @ApiQuery({ name: 'from_date', required: false, description: 'Start date for performance calculation' })
  @ApiQuery({ name: 'to_date', required: false, description: 'End date for performance calculation' })
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

  // Aggregation
  @Post('aggregate/trips')
  @ApiOperation({ summary: 'Generate aggregated trip data analysis' })
  @ApiBody({ type: ExportRequestDto })
  @ApiResponseConstruction({
    status: 200,
    description: 'Trip data aggregated successfully',
  })
  async aggregateTripData(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() request: ExportRequestDto,
  ) {
    return this.reportService.aggregateTripData(claims, request);
  }

  @Post('aggregate/tasks')
  @ApiOperation({ summary: 'Generate aggregated task data analysis' })
  @ApiBody({ type: ExportRequestDto })
  @ApiResponseConstruction({
    status: 200,
    description: 'Task data aggregated successfully',
  })
  async aggregateTaskData(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() request: ExportRequestDto,
  ) {
    return this.reportService.aggregateTaskData(claims, request);
  }
}