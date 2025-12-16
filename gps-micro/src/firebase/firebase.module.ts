import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseService } from 'src/firebase/firebase.service';
import { GpsLogModule } from 'src/modules/gps-log/gps-log.module';

@Module({
  imports: [ConfigModule, GpsLogModule],
  providers: [FirebaseService],
  exports: [FirebaseService],
})
export class FirebaseModule {}
