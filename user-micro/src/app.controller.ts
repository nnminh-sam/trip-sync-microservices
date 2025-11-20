import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvSchema } from './config';

@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService<EnvSchema>) {}

  @Get()
  getStatus() {
    const port = this.configService.get<number>('APP_PORT') || 3000;
    return {
      message: `Server is running at port ${port}`,
      port,
      service: 'user-microservice',
      timestamp: new Date().toISOString(),
    };
  }
}
