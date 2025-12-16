import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GpsLogService } from './gps-log.service';
import { GpsLogMessagePattern } from './gps-log-message.pattern';
import { GpsLog } from 'src/models/gps-log.model';

export interface MessagePayloadDto<T = null> {
  claims?: any;
  request?: {
    body?: T;
    path?: Record<string, any>;
    param?: Record<string, any>;
  };
}

interface QueryGpsLogRequest {
  userId: string;
  tripId: string;
  beginDate?: string;
  endDate?: string;
  limit?: number;
}

@Controller()
export class GpsLogController {
  constructor(private readonly gpsLogService: GpsLogService) {}

  @MessagePattern(GpsLogMessagePattern.query)
  async queryGpsLogs(
    @Payload() payload: MessagePayloadDto<QueryGpsLogRequest>,
  ): Promise<GpsLog[]> {
    const { userId, tripId, beginDate, endDate, limit } = payload.request?.body || payload.request?.param || {};

    if (!userId || !tripId) {
      throw new Error('userId and tripId are required parameters');
    }

    const parsedBeginDate = beginDate ? new Date(beginDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;
    const parsedLimit = limit ? parseInt(limit as any, 10) : 100;

    return this.gpsLogService.queryGpsLogs(
      userId,
      tripId,
      parsedBeginDate,
      parsedEndDate,
      parsedLimit,
    );
  }
}
