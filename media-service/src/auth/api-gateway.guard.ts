import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiGatewayClient } from './api-gateway.client';

/**
 * API Gateway Guard
 *
 * This guard verifies JWT tokens using the API Gateway's authorization endpoint.
 * It performs three checks:
 * 1. Validates JWT signature and expiration
 * 2. Calls API Gateway to authorize the request
 * 3. Attaches user info to the request
 */
@Injectable()
export class ApiGatewayGuard implements CanActivate {
  private readonly logger = new Logger(ApiGatewayGuard.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly apiGatewayClient: ApiGatewayClient,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromRequest(request);

    if (!token) {
      this.logger.warn('No token provided in request');
      throw new UnauthorizedException('Missing authorization token');
    }

    try {
      const authRequest = {
        roles: ["employee", "system admin"],
        action: 'create',
        resource: 'task proof',
      };

      await this.apiGatewayClient.authorizeRequest(token, authRequest);


      this.logger.debug(`Request authorized`);
      return true;
    } catch (error) {
      this.logger.error(
        `Authentication/Authorization failed: ${error instanceof Error ? error.message : String(error)}`,
      );

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Extract Bearer token from Authorization header
   */
  private extractTokenFromRequest(request: any): string | undefined {
    const authHeader = request.headers?.authorization;

    if (!authHeader) {
      return undefined;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return undefined;
    }

    return parts[1];
  }
}
