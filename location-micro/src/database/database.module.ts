import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EnvSchema } from 'src/config';
import { Location } from 'src/models/location.model';

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
          entities: [Location],
          migrations: ['dist/migrations/*.js'],
          synchronize: false, // Set to false to avoid automatic schema sync issues
          logging: true,
          migrationsRun: false, // Set to true if you want migrations to run automatically
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
