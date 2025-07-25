import { Inject, Injectable, Logger, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

export enum LocationMessagePattern {
  FIND_ONE = 'location.find_one',
}

@Injectable()
export class LocationClient {
  private readonly logger = new Logger(LocationClient.name);

  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  private readonly systemClaims = {
    sub: 'trip-micro@system',
    email: 'trip-micro@system',
    role: 'system admin',
  };

  async findOne(location_id: string) {
    this.logger.log(`Checking location: ${location_id}`);

    return await firstValueFrom(
      this.client.send(LocationMessagePattern.FIND_ONE, {
        claims: this.systemClaims,
        request: {
          path: { id: location_id },
        },
      }),
    );
  }
}
