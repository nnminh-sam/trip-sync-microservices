import { Injectable, Logger } from '@nestjs/common';
import {TripClient} from '../../client/trip.client'
import { FilterReportDto } from './dtos/filter-report.dto';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { FilterTripDto } from '../../dtos/filter-trip.dto';
import { TaskClient } from 'src/client/task.client';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(private readonly tripClient: TripClient,
    private readonly taskClient: TaskClient
  ) {}

  async getTripSummary(claims: TokenClaimsDto, filter: FilterReportDto) {
  this.logger.log('Generating trip summary report');
  this.logger.debug(`Calling tripClient.findAll with filter: ${JSON.stringify(filter)}`);

  const tripFilter: FilterTripDto = {
    from_date: filter.from_date,
    to_date: filter.to_date,
    status: filter.status,
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

  async getTaskCompletion(claims: TokenClaimsDto, filter: FilterReportDto) {
  this.logger.log('Generating TaskCompletion report');
  this.logger.debug(`Calling taskClient.findAll with filter: ${JSON.stringify(filter)}`);

  const tripFilter: FilterTripDto = {
    from_date: filter.from_date,
    to_date: filter.to_date,
    status: filter.status,
  };

  try {
    const response = await this.taskClient.findAll(claims, tripFilter);
    this.logger.log(`Trip summary retrieved with ${response?.data?.length ?? 0} records`);
    return response?.data ?? [];
  } catch (error) {
    this.logger.error('Error while getting trip summary:', error.stack);
    throw error;
  }
}
}
