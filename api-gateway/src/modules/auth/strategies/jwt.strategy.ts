import {
  BadRequestException,
  Injectable,
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
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService<EnvSchema>,
    private readonly redisService: RedisService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  // ? Why removing the request, the token is not decoded? Currently, this function work
  async validate(req: Request, payload: TokenClaimsDto) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    if (!token) {
      throw new BadRequestException('No Token Provided');
    }

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
