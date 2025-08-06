import { Inject, Injectable, Logger, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
export enum TaskMessagePattern {
  findAll = 'task.find',
}

@Injectable()
export class TaskClient {
  private readonly logger = new Logger(TaskClient.name);

  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  private readonly systemClaims = {
    sub: 'task-micro@system',
    email: 'task-micro@system',
    role: 'system admin',
  };

 async findAll(claims: TokenClaimsDto, filter?: any): Promise<any> {
  const response = await firstValueFrom(
    this.client.send(TaskMessagePattern.findAll, {
      claims, 
      request: { body: filter },
    }),
  );
  return response;
}
}
