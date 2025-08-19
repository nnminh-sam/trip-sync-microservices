import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as csvWriter from 'csv-writer';
import { ExportConfigDto, ExportFormat } from '../dtos/export-config.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);
  private readonly exportDir = path.join(process.cwd(), 'exports');

  constructor() {
    this.ensureExportDirectory();
  }

  private ensureExportDirectory() {
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
  }

  async exportTripReport(data: any[], config: ExportConfigDto): Promise<string> {
    this.logger.log(`Exporting trip report in ${config.format} format`);

    switch (config.format) {
      case ExportFormat.CSV:
        return this.exportTripToCSV(data, config);
      case ExportFormat.EXCEL:
        return this.exportTripToExcel(data, config);
      default:
        throw new Error(`Unsupported export format: ${config.format}`);
    }
  }

  async exportTaskReport(data: any[], config: ExportConfigDto): Promise<string> {
    this.logger.log(`Exporting task report in ${config.format} format`);

    switch (config.format) {
      case ExportFormat.CSV:
        return this.exportTaskToCSV(data, config);
      case ExportFormat.EXCEL:
        return this.exportTaskToExcel(data, config);
      default:
        throw new Error(`Unsupported export format: ${config.format}`);
    }
  }

  private async exportTripToCSV(data: any[], config: ExportConfigDto): Promise<string> {
    const fileName = `trip_report_${Date.now()}.csv`;
    const filePath = path.join(this.exportDir, fileName);

    const headers = [
      { id: 'id', title: 'Trip ID' },
      { id: 'title', title: 'Title' },
      { id: 'description', title: 'Description' },
      { id: 'status', title: 'Status' },
      { id: 'assignee_name', title: 'Assignee' },
      { id: 'start_date', title: 'Start Date' },
      { id: 'end_date', title: 'End Date' },
      { id: 'location', title: 'Location' },
      { id: 'created_by', title: 'Created By' },
      { id: 'created_at', title: 'Created At' },
    ];

    if (config.include_locations) {
      headers.push(
        { id: 'check_in_location', title: 'Check-in Location' },
        { id: 'check_out_location', title: 'Check-out Location' }
      );
    }

    const csvWriterInstance = csvWriter.createObjectCsvWriter({
      path: filePath,
      header: headers,
    });

    const records = data.map(trip => ({
      ...trip,
      start_date: this.formatDate(trip.start_date),
      end_date: this.formatDate(trip.end_date),
      created_at: this.formatDate(trip.created_at),
      check_in_location: trip.check_in ? `${trip.check_in.lat},${trip.check_in.lng}` : '',
      check_out_location: trip.check_out ? `${trip.check_out.lat},${trip.check_out.lng}` : '',
    }));

    await csvWriterInstance.writeRecords(records);
    this.logger.log(`CSV export completed: ${filePath}`);
    return filePath;
  }

  private async exportTripToExcel(data: any[], config: ExportConfigDto): Promise<string> {
    const fileName = `trip_report_${Date.now()}.xlsx`;
    const filePath = path.join(this.exportDir, fileName);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Trip Report');

    // Define columns
    worksheet.columns = [
      { header: 'Trip ID', key: 'id', width: 15 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Assignee', key: 'assignee_name', width: 20 },
      { header: 'Start Date', key: 'start_date', width: 15 },
      { header: 'End Date', key: 'end_date', width: 15 },
      { header: 'Location', key: 'location', width: 25 },
      { header: 'Created By', key: 'created_by', width: 20 },
      { header: 'Created At', key: 'created_at', width: 15 },
    ];

    // Add data
    data.forEach(trip => {
      worksheet.addRow({
        ...trip,
        start_date: this.formatDate(trip.start_date),
        end_date: this.formatDate(trip.end_date),
        created_at: this.formatDate(trip.created_at),
      });
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add summary if requested
    if (config.include_summary) {
      const summarySheet = workbook.addWorksheet('Summary');
      this.addTripSummary(summarySheet, data);
    }

    await workbook.xlsx.writeFile(filePath);
    this.logger.log(`Excel export completed: ${filePath}`);
    return filePath;
  }

  private async exportTaskToCSV(data: any[], config: ExportConfigDto): Promise<string> {
    const fileName = `task_report_${Date.now()}.csv`;
    const filePath = path.join(this.exportDir, fileName);

    const headers = [
      { id: 'id', title: 'Task ID' },
      { id: 'trip_id', title: 'Trip ID' },
      { id: 'title', title: 'Title' },
      { id: 'description', title: 'Description' },
      { id: 'status', title: 'Status' },
      { id: 'progress', title: 'Progress (%)' },
      { id: 'assignee_id', title: 'Assignee' },
      { id: 'created_at', title: 'Created At' },
      { id: 'completed_at', title: 'Completed At' },
    ];

    if (config.include_evidence) {
      headers.push(
        { id: 'evidence_count', title: 'Evidence Count' },
        { id: 'objectives_achieved', title: 'Objectives Achieved' }
      );
    }

    const csvWriterInstance = csvWriter.createObjectCsvWriter({
      path: filePath,
      header: headers,
    });

    const records = data.map(task => ({
      ...task,
      created_at: this.formatDate(task.created_at),
      completed_at: this.formatDate(task.completed_at),
      evidence_count: task.evidence_attachments?.length || 0,
      objectives_achieved: task.objectives_achieved?.join('; ') || '',
    }));

    await csvWriterInstance.writeRecords(records);
    this.logger.log(`CSV export completed: ${filePath}`);
    return filePath;
  }

  private async exportTaskToExcel(data: any[], config: ExportConfigDto): Promise<string> {
    const fileName = `task_report_${Date.now()}.xlsx`;
    const filePath = path.join(this.exportDir, fileName);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Task Report');

    // Define columns
    worksheet.columns = [
      { header: 'Task ID', key: 'id', width: 15 },
      { header: 'Trip ID', key: 'trip_id', width: 15 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Progress (%)', key: 'progress', width: 12 },
      { header: 'Assignee', key: 'assignee_id', width: 20 },
      { header: 'Created At', key: 'created_at', width: 15 },
      { header: 'Completed At', key: 'completed_at', width: 15 },
    ];

    // Add data
    data.forEach(task => {
      worksheet.addRow({
        ...task,
        created_at: this.formatDate(task.created_at),
        completed_at: this.formatDate(task.completed_at),
      });
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add conditional formatting for status
    const statusColumn = worksheet.getColumn('status');
    statusColumn.eachCell((cell, rowNumber) => {
      if (rowNumber > 1) {
        switch (cell.value) {
          case 'completed':
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF90EE90' },
            };
            break;
          case 'in_progress':
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFFFE0' },
            };
            break;
          case 'cancelled':
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFCCCB' },
            };
            break;
        }
      }
    });

    // Add summary if requested
    if (config.include_summary) {
      const summarySheet = workbook.addWorksheet('Summary');
      this.addTaskSummary(summarySheet, data);
    }

    await workbook.xlsx.writeFile(filePath);
    this.logger.log(`Excel export completed: ${filePath}`);
    return filePath;
  }

  private addTripSummary(worksheet: ExcelJS.Worksheet, data: any[]) {
    worksheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 },
    ];

    const statusCounts = this.groupByField(data, 'status');
    const totalTrips = data.length;
    const completedTrips = statusCounts['completed'] || 0;
    const completionRate = totalTrips > 0 ? (completedTrips / totalTrips * 100).toFixed(2) : 0;

    worksheet.addRows([
      { metric: 'Total Trips', value: totalTrips },
      { metric: 'Completed Trips', value: completedTrips },
      { metric: 'In Progress Trips', value: statusCounts['in_progress'] || 0 },
      { metric: 'Pending Trips', value: statusCounts['pending'] || 0 },
      { metric: 'Cancelled Trips', value: statusCounts['cancelled'] || 0 },
      { metric: 'Completion Rate (%)', value: completionRate },
    ]);

    worksheet.getRow(1).font = { bold: true };
  }

  private addTaskSummary(worksheet: ExcelJS.Worksheet, data: any[]) {
    worksheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 },
    ];

    const statusCounts = this.groupByField(data, 'status');
    const totalTasks = data.length;
    const completedTasks = statusCounts['completed'] || 0;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(2) : 0;
    const avgProgress = data.reduce((sum, task) => sum + (task.progress || 0), 0) / totalTasks;

    worksheet.addRows([
      { metric: 'Total Tasks', value: totalTasks },
      { metric: 'Completed Tasks', value: completedTasks },
      { metric: 'In Progress Tasks', value: statusCounts['in_progress'] || 0 },
      { metric: 'Pending Tasks', value: statusCounts['pending'] || 0 },
      { metric: 'Cancelled Tasks', value: statusCounts['cancelled'] || 0 },
      { metric: 'Completion Rate (%)', value: completionRate },
      { metric: 'Average Progress (%)', value: avgProgress.toFixed(2) },
    ]);

    worksheet.getRow(1).font = { bold: true };
  }

  private groupByField(data: any[], field: string): Record<string, number> {
    return data.reduce((acc, item) => {
      const key = item[field] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  private formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  async getExportFilePath(fileName: string): Promise<string> {
    return path.join(this.exportDir, fileName);
  }

  async deleteExportFile(fileName: string): Promise<void> {
    const filePath = path.join(this.exportDir, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      this.logger.log(`Deleted export file: ${fileName}`);
    }
  }
}