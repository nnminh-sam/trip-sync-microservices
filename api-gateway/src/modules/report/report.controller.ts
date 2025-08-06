import { Query, Controller, Get, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponseConstruction } from 'src/common/decorators/api-response-construction.decorator';
import { RequestUserClaims } from 'src/common/decorators/request-user-claims.decorator';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { FilterReportDto } from './dtos/filter-report.dto';
import { ReportService } from './report.service';
import { ExportLog } from 'src/models/export-log.model';

@ApiBearerAuth()
@ApiTags('Reports')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('trips')
  @ApiOperation({ summary: 'Export trip summary' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Trip summary exported',
    model: ExportLog,
  })
  async exportTripSummary(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() payload: FilterReportDto,
  ) {
    return this.reportService.getTripSummary(claims, payload);
  }

  @Get('tasks')
  @ApiOperation({ summary: 'Export Task Completion' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Task Completion exported',
    model: ExportLog,
  })
  async exportTaskCompletion(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() payload: FilterReportDto,
  ) {
    return this.reportService.getTaskCompletion(claims, payload);
  }
}
