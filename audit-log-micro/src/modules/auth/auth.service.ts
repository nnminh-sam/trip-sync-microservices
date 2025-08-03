import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATSClient } from 'src/client/clients';
import { AuthorizeClaimPayloadDto } from 'src/dtos/authorize-claim-payload.dto';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { AuthMessagePattern } from 'src/modules/auth/auth-message.pattern';
import { NatsClientSender } from 'src/utils';

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

  async authorize(
    claims: TokenClaimsDto,
    authorizeClaimPayload: AuthorizeClaimPayloadDto,
  ) {
    this.logger.log(`Authorizing claims for email: ${claims.email}`);

    try {
      const response = await this.sender.send({
        messagePattern: 'authorizeClaims',
        payload: {
          request: {
            body: {
              claims,
              required: {
                roles: authorizeClaimPayload.roles,
                permission: {
                  action: authorizeClaimPayload.action,
                  resource: authorizeClaimPayload.resource,
                },
              },
            },
          },
        },
      });

      this.logger.log('Authorization successful');
      return response;
    } catch (error) {
      this.logger.error('Authorization error:', error);
      throw new UnauthorizedException('Unauthorized request');
    }
  }
}
