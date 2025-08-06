import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { tableSchemas } from './models';
import { ExportModule } from './modules/export/export.module';
import { ReportModule } from './modules/report/report.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT),
      username: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      entities: tableSchemas,
      synchronize: true, // Chỉ bật khi dev
    }),

    ClientsModule.register([
      {
        name: 'TRIP_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_SERVER],
        },
      },
      {
        name: 'TASK_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_SERVER],
        },
      },
    ]),

    ExportModule, ReportModule
  ],
})

export class AppModule {}
