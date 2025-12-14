import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EnvSchema } from 'src/config';
import { tableSchemas } from 'src/models';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<EnvSchema>) => {
        return {
          type: 'mysql',
          host: configService.get<string>('MYSQL_HOST'),
          port: parseInt(configService.get<string>('MYSQL_PORT') || '3306', 10),
          username: configService.get<string>('MYSQL_USER'),
          password: configService.get<string>('MYSQL_PASSWORD'),
          database: configService.get<string>('MYSQL_DATABASE'),
          entities: tableSchemas,
          synchronize: true,
          logging: true,
          legacySpatialSupport: false,
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
