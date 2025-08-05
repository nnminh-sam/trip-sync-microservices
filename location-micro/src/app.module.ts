import { Module } from '@nestjs/common';
import { LocationModule } from './modules/location/location.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from 'src/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
    }),
    DatabaseModule,
    LocationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
