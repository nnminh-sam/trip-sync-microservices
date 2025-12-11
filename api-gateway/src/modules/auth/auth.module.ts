import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ClientModule } from 'src/client/client.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EnvSchema } from 'src/config';
import { JwtStrategy } from 'src/modules/auth/strategies/jwt.strategy';
import { DatabaseModule } from 'src/database/database.module';
import { UserModule } from 'src/modules/user/user.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    UserModule,
    DatabaseModule,
    ClientModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvSchema>) => {
        return {
          isGlobal: true,
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: { expiresIn: '1h' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
