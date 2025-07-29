import { Inject, Injectable, Logger, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
export enum TripMessagePattern {
  FIND_ALL = 'trip.find',
}

@Injectable()
export class TripClient {
  private readonly logger = new Logger(TripClient.name);

  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  private readonly systemClaims = {
    sub: 'trip-micro@system',
    email: 'trip-micro@system',
    role: 'system admin',
  };

 async findAll(claims: TokenClaimsDto, filter?: any): Promise<any> {
  const response = await firstValueFrom(
    this.client.send(TripMessagePattern.FIND_ALL, {
      claims, 
      request: { body: filter },
    }),
  );
  return response;
}
}
