import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

export interface AuthorizationRequest {
  roles: string[];
  action: string;
  resource: string;
}

export interface AuthorizationResponse {
  data: {
    id?: string;
    message: string;
  };
  path: string;
  method: string;
  timestamp: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  roles: string[];
  exp: number;
  iat: number;
}

/**
 * API Gateway Auth Client
 *
 * This service handles authentication and authorization by calling
 * the API Gateway's authorize-request endpoint.
 */
@Injectable()
export class ApiGatewayClient {
  private readonly logger = new Logger(ApiGatewayClient.name);
  private readonly apiGatewayUrl: string;
  private readonly authorizationEndpoint: string;

  constructor(private readonly configService: ConfigService) {
    this.apiGatewayUrl = this.configService.get('auth.apiGatewayUrl');
    console.log(
      '🚀 ~ ApiGatewayClient ~ constructor ~ this.apiGatewayUrl:',
      this.apiGatewayUrl,
    );
    this.authorizationEndpoint = `${this.apiGatewayUrl}/api/v1/auth/authorize-request`;
    console.log(
      '🚀 ~ ApiGatewayClient ~ constructor ~ this.authorizationEndpoint:',
      this.authorizationEndpoint,
    );
  }

  /**
   * Authorize a request using the API Gateway
   *
   * @param token - JWT Bearer token
   * @param authRequest - Authorization request details
   * @returns Authorization response if successful
   * @throws UnauthorizedException if authorization fails
   */
  async authorizeRequest(
    token: string,
    authRequest: AuthorizationRequest,
  ): Promise<AuthorizationResponse> {
    console.log(
      '🚀 ~ ApiGatewayClient ~ authorizeRequest ~ authRequest:',
      authRequest,
    );
    console.log('🚀 ~ ApiGatewayClient ~ authorizeRequest ~ token:', token);
    try {
      this.logger.debug(
        `Authorizing request with roles: ${authRequest.roles?.join(', ')}`,
      );

      const response = await axios.post<AuthorizationResponse>(
        this.authorizationEndpoint,
        authRequest,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        },
      );

      this.logger.debug(`Authorization successful`);
      return response.data;
    } catch (error) {
      console.log('🚀 ~ ApiGatewayClient ~ authorizeRequest ~ error:', error);
      this.logger.error(`Authorization failed: ${this.getErrorMessage(error)}`);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        if (status === 401 || status === 403) {
          throw new UnauthorizedException(
            'Unauthorized: Invalid or expired token',
          );
        }

        if (status === 400) {
          throw new UnauthorizedException(
            `Unauthorized: ${error.response?.data?.message || 'Invalid request'}`,
          );
        }
      }

      throw new UnauthorizedException('Authorization service unavailable');
    }
  }

  /**
   * Extract error message from axios error
   */
  private getErrorMessage(error: any): string {
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.message) {
        return error.response.data.message;
      }
      return error.message;
    }
    return error instanceof Error ? error.message : String(error);
  }
}
