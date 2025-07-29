import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponseConstruction } from 'src/common/decorators/api-response-construction.decorator';
import { RequestUserClaims } from 'src/common/decorators/request-user-claims.decorator';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { ExportRequestDto } from './dtos/export-request.dto';
import { TripSummaryFilterDto } from './dtos/trip-summary-filter.dto';
import { TaskCompletionFilterDto } from './dtos/task-completion-filter.dto';
import { ExportLog } from 'src/models';

@ApiBearerAuth()
@ApiTags('Reports & Exports')
@Controller()
export class ReportController {
  constructor() {}

  @Get('reports/trips')
  @ApiOperation({ summary: 'Export trip summary' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Trip summary report data',
    isArray: true,
    model: ExportLog,
  })
  async getTripSummary(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Query() payload: TripSummaryFilterDto,
  ) {
    return { claims, payload };
  }

  @Get('reports/tasks')
  @ApiOperation({ summary: 'Export task completion' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Task completion report data',
    isArray: true,
    model: ExportLog,
  })
  async getTaskCompletion(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Query() payload: TaskCompletionFilterDto,
  ) {
    return { claims, payload };
  }

  @Post('exports')
  @ApiOperation({ summary: 'Request export (CSV/Excel)' })
  @ApiResponseConstruction({
    status: 201,
    description: 'Export request created',
    model: ExportLog,
  })
  @ApiBody({ type: ExportRequestDto })
  async createExport(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() payload: ExportRequestDto,
  ) {
    return { claims, payload };
  }

  @Get('exports/:id')
  @ApiOperation({ summary: 'Get export file/status' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Export details and download link',
    model: ExportLog,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Export ID',
  })
  async getExport(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ) {
    return { claims, id };
  }
}
