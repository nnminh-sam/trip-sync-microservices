import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseConfigService } from '../../config/firebase.config';
import { FirebaseService } from './firebase.service';
import { FirebaseController } from './firebase.controller';

@Module({
  imports: [ConfigModule],
  providers: [FirebaseConfigService, FirebaseService],
  controllers: [FirebaseController],
  exports: [FirebaseService],
})
export class FirebaseModule {}
