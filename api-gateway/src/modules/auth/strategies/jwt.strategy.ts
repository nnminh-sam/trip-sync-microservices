import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EnvSchema } from 'src/config';
import { Request } from 'express';
import { RedisService } from '../../../database/redis.service';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { UserService } from 'src/modules/user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger: Logger;

  constructor(
    private readonly configService: ConfigService<EnvSchema>,
    private readonly redisService: RedisService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
    this.logger = new Logger(JwtStrategy.name);
    console.log('JWT constructor called');
  }

  async validate(payload: TokenClaimsDto) {
    const isBlacklisted = await this.redisService.isBlacklisted(payload.jit);
    if (isBlacklisted) {
      throw new BadRequestException('Invalid Token');
    }

    const user = await this.userService.findById(payload);
    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    return payload;
  }
}
