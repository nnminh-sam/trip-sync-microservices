import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATSClient } from 'src/client/clients';

@Injectable()
export class LocationService {
  private readonly logger: Logger = new Logger(LocationService.name);
  constructor(
    @Inject(NATSClient.name)
    private readonly natsClient: ClientProxy,
  ) {}
}
