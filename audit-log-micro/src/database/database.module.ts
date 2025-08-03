import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EnvSchema } from 'src/config';
import { AuditLog } from 'src/models/audit-log.model';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<EnvSchema>) => {
        return {
          type: 'mysql',
          host: configService.get<string>('MYSQL_HOST'),
          port: 3306,
          username: configService.get<string>('MYSQL_USER'),
          password: configService.get<string>('MYSQL_PASSWORD'),
          database: configService.get<string>('MYSQL_DATABASE'),
          entities: [AuditLog],
          synchronize: true,
          logging: true,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {
  private readonly logger: Logger = new Logger(DatabaseModule.name);
  constructor() {
    this.logger.log('Connected Successfully to MySQL Database');
  }
}
