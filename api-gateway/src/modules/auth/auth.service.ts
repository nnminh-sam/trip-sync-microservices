import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATSClient } from 'src/client/clients';
import { AuthMessagePattern } from 'src/modules/auth/auth-message.pattern';
import { LoginDto } from 'src/modules/auth/dtos/login-payload.dto';
import { NatsClientSender } from 'src/utils';
import { RedisService } from '../../database/redis.service';
import { JwtService } from '@nestjs/jwt';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { ExchangeTokenDto } from 'src/modules/auth/dtos/exchange-token.dto';
import { v4 as uuid } from 'uuid';
import { AuthorizeClaimPayloadDto } from 'src/modules/auth/dtos/authorize-claim-payload.dto';
import { AuthResponseDto } from 'src/modules/auth/dtos/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);
  private readonly sender: NatsClientSender<typeof AuthMessagePattern>;

  constructor(
    @Inject(NATSClient.name)
    private readonly natsClient: ClientProxy,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
  ) {
    this.sender = new NatsClientSender(natsClient, AuthMessagePattern);
  }

  private checkTokenExpiration(claims: TokenClaimsDto) {
    if (!claims?.exp) {
      this.logger.error('Token Missing Expiration Time');
      throw new BadRequestException('Invalid Token');
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const timeToExpiry = claims.exp - currentTime;
    return {
      isExpired: timeToExpiry <= 0,
      timeToExpiry,
    };
  }

  async generateTokens({
    email,
    id,
    role,
  }: {
    email: string;
    id: string;
    role: string;
  }) {
    const payload: TokenClaimsDto = {
      jit: uuid(),
      iat: new Date().getTime(),
      email,
      sub: id,
      role,
    };
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '1h' }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '1d' }),
    };
  }

  decodeToken(token: string): TokenClaimsDto {
    return this.jwtService.decode(token);
  }

  async authorizeClaims(
    claims: TokenClaimsDto,
    authorizeClaimPayload: AuthorizeClaimPayloadDto,
  ) {
    try {
      return await this.sender.send({
        messagePattern: 'authorizeClaims',
        payload: {
          claims,
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
    } catch (error) {
      this.logger.error('Error authorizing claims', error);
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    const user = await this.sender.send({
      messagePattern: 'login',
      payload: { request: { body: loginDto } },
    });

    const tokens = await this.generateTokens({
      email: user.email,
      id: user.id,
      role: user.role.name,
    });

    return {
      ...tokens,
      user,
    } as AuthResponseDto;
  }

  async logout(claims: TokenClaimsDto): Promise<{ message: string }> {
    try {
      const { isExpired, timeToExpiry } = this.checkTokenExpiration(claims);
      if (!isExpired) {
        await this.redisService.addToBlacklist(claims.jit, timeToExpiry);
      }

      return { message: 'Successfully Logged Out' };
    } catch (error) {
      this.logger.error('Unexpected Error:', error);
      throw new BadRequestException('Invalid Token');
    }
  }

  async exchangeTokens(payload: ExchangeTokenDto) {
    const claims = this.decodeToken(payload.refreshToken);
    const { isExpired, timeToExpiry } = this.checkTokenExpiration(claims);
    if (!isExpired) {
      await this.redisService.addToBlacklist(claims.jit, timeToExpiry);
      const accessTokenClaims = this.decodeToken(payload.accessToken);
      const accessTokenExpiration =
        this.checkTokenExpiration(accessTokenClaims);
      await this.redisService.addToBlacklist(
        accessTokenClaims.jit,
        accessTokenExpiration.timeToExpiry,
      );
    }

    return await this.generateTokens({
      email: claims.email,
      id: claims.sub,
      role: claims.role,
    });
  }

  async updatePassword(claims: TokenClaimsDto) {
    return await this.sender.send({
      messagePattern: 'updatePassword',
      payload: { claims },
    });
  }
}
