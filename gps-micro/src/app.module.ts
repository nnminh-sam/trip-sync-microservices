import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from 'src/config';
import { DatabaseModule } from 'src/database/database.module';
import { FirebaseModule } from 'src/firebase/firebase.module';
import { GpsLogModule } from 'src/modules/gps-log/gps-log.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
    }),
    DatabaseModule,
    FirebaseModule,
    GpsLogModule,
  ],
})
export class AppModule {}
