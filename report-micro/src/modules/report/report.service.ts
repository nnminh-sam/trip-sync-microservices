import { Injectable, Logger } from '@nestjs/common';
import { TripClient} from '../../client/trip.client'
import { FilterReportTripDto } from './dtos/filter-report-trip.dto';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { FilterTripDto } from '../../dtos/filter-trip.dto';
import { TaskClient } from 'src/client/task.client';
import { FilterReportTaskDto } from './dtos/filter-report-task.dto';
import { FilterTaskDto } from 'src/dtos/filter-task.dto';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(private readonly tripClient: TripClient,
    private readonly taskClient: TaskClient
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
}
