import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { EmptyError } from 'rxjs';
import { NATSClient } from 'src/client/clients';
import { AuthorizeClaimsPayloadDto } from 'src/dtos/authorize-claim-payload.dto';
import { AuthMessagePattern } from 'src/modules/auth/auth-message.pattern';
import { NatsClientSender, throwRpcException } from 'src/utils';

@Injectable()
export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);
  private readonly sender: NatsClientSender<typeof AuthMessagePattern>;

  constructor(
    @Inject(NATSClient.name)
    private readonly natsClient: ClientProxy,
  ) {
    this.sender = new NatsClientSender(natsClient, AuthMessagePattern);
  }

  async authorize(payload: AuthorizeClaimsPayloadDto) {
    const { claims, required } = payload;
    this.logger.log(`Authorizing claims for email: ${claims.email}`);

    try {
      const response = await this.sender.send({
        messagePattern: 'authorizeClaims',
        payload: {
          request: {
            body: {
              claims,
              required: {
                roles: required.roles,
                permission: {
                  action: required.permission.action,
                  resource: required.permission.resource,
                },
              },
            },
          },
        },
      });

      this.logger.log('Authorization successful');
      return response;
    } catch (error: any) {
      console.log('🚀 ~ AuthService ~ authorize ~ error:', error);
      this.logger.error('Authorization error:', error);
      if (error instanceof EmptyError) {
        throwRpcException({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Service Unavailable',
        });
      }
      throwRpcException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized request',
      });
    }
  }
}
