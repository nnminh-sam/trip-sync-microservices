import { Module } from '@nestjs/common';
import { ApiGatewayClient } from './api-gateway.client';
import { ApiGatewayGuard } from './api-gateway.guard';

@Module({
  imports: [
  ],
  providers: [ApiGatewayClient, ApiGatewayGuard],
  exports: [ApiGatewayGuard, ApiGatewayClient],
})
export class AuthModule {}
