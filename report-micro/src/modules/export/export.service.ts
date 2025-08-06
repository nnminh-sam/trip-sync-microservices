import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExportLog } from 'src/models/export-logs.model';
import { CreateExportDto } from './dtos/create-export.dto';
import { FilterReportTripDto } from './dtos/filter-report-trip.dto';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { parse } from 'json2csv';
import { NatsClientService } from 'src/common/services/nats-client.service';
import { ReportService } from '../report/report.service';
import { generateFileName, writeToLocalFile } from 'src/utils/file';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    @InjectRepository(ExportLog)
    private readonly exportLogRepo: Repository<ExportLog>,
    private readonly natsClient: NatsClientService,
    private readonly reportService: ReportService
  ) {}

  
  async create(claims: TokenClaimsDto, dto: CreateExportDto) {
    const log = this.exportLogRepo.create({
      requested_by: claims.sub,
      export_type: dto.export_type,
      filters: dto.filters,
    });

    await this.exportLogRepo.save(log);

    try {
      // Parse filters JSON string -> object
      const rawFilters = JSON.parse(dto.filters || '{}');

      // Convert to FilterReportDto
      const parsedFilters: FilterReportTripDto = {
        ...rawFilters,
        from_date: dto.date_from,
        to_date: dto.date_to,
        status: rawFilters.status,
        assignee_id: rawFilters.assignee_id,
      };
      const selectedColumns: string[] = JSON.parse(dto.columns || '[]');

      // Get data
      let data = [];
      if (dto.export_type === 'trips') {
        data = await this.reportService.getTripSummary(claims, parsedFilters);
      }
      //Get task here  
    


      // Select columns
      const filteredData = data.map((item) =>
        selectedColumns.reduce((obj, col) => {
          obj[col] = item[col];
          return obj;
        }, {}),
      );

      // Format to CSV
      const csvData = parse(filteredData, { fields: selectedColumns });

      // Save file
      const fileName = generateFileName(dto.export_type, dto.format);
      const filePath = await writeToLocalFile(fileName, csvData);

      // Update export log
      log.file_url = filePath;
      await this.exportLogRepo.save(log);

      return {
        data: data,
        success: true,
        id: log.id,
        createdAt: log.createdAt,
        updatedAt: log.updatedAt,
        requestedBy: log.requested_by,
        exportType: log.export_type,
        filterParams: log.filters,
        fileUrl: log.file_url,
        status: rawFilters.status
      };
    } catch (error) {
      this.logger.error('Export failed:', error.stack);
      await this.exportLogRepo.save(log);

      throw error;
    }
  }

  async findOne(id: string) {
    const exportLog = await this.exportLogRepo.findOne({ where: { id } });

    if (!exportLog) {
      this.logger.warn(`ExportLog with id ${id} not found`);
      throw new NotFoundException(`Export log with id ${id} not found`);
    }

    return exportLog;
  }
}
