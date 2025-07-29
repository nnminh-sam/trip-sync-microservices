import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExportLog } from 'src/models/export-logs.model';
import { CreateExportDto } from './dtos/create-export.dto';
import { NatsClientService } from 'src/nats/nats-client.service';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    @InjectRepository(ExportLog)
    private readonly exportLogRepo: Repository<ExportLog>,
    private readonly natsClient: NatsClientService,
  ) {}

  async createExportRequest(dto: CreateExportDto) {
    const { export_type, filter_params } = dto;

    // 1. Gọi report service tương ứng qua NATS
    const fileBuffer = await this.natsClient.send(`report.${export_type}`, {
      body: filter_params,
    });

    if (!fileBuffer || !fileBuffer.buffer) {
      throw new Error(`Export failed: No file returned from report.${export_type}`);
    }

    // 2. Tạo file và đường dẫn giả lập (có thể thay bằng lưu Google Cloud Storage)
    const exportId = uuidv4();
    const filename = `${export_type}-${Date.now()}.csv`;
    const file_url = `/exports/${filename}`; // Giả lập URL (có thể là public URL từ cloud)

    // 3. Lưu log vào bảng export_logs
    const exportLog = this.exportLogRepo.create({
      export_type,
      filter_params: JSON.stringify(filter_params),
      file_url,
    });

    await this.exportLogRepo.save(exportLog);

    // 4. (Tuỳ chọn) Lưu file thực tế vào file system hoặc cloud tại đây
    // Ví dụ: await writeFile(`/path/to/exports/${filename}`, fileBuffer.buffer);

    this.logger.log(`Export log created: ${exportId} - ${file_url}`);

    return { id: exportId, file_url };
  }

  
}
