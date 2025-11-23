import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PublicRequest } from 'src/common/decorators/public-request.decorator';

@ApiTags('Health')
@Controller({
  version: VERSION_NEUTRAL,
})
export class AppController {
  @PublicRequest()
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
      natsMaxPayload: process.env.NATS_MAX_PAYLOAD || 'default',
    };
  }

  @PublicRequest()
  @Get()
  @ApiOperation({ summary: 'Root endpoint' })
  @ApiResponse({ status: 200, description: 'API Gateway information' })
  root() {
    return {
      name: 'Trip Sync API Gateway',
      version: '1.0.0',
      description: 'API Gateway for Trip Sync Microservices',
      documentation: '/api-document',
      health: '/health',
    };
  }
}
