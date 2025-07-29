import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATSClient } from 'src/client/clients';

@Injectable()
export class LocationService {
  constructor(
    @Inject(NATSClient.name)
    private readonly natsClient: ClientProxy,
    private readonly logger: Logger,
  ) {
    this.logger = new Logger(LocationService.name);
  }
}
