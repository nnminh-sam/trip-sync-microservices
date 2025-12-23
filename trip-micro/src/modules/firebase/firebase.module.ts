import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { FirebaseConfigService } from '../../config/firebase.config';
import { FirebaseService } from './firebase.service';
import { FirebaseController } from './firebase.controller';
import { NATSClient } from '../../client/clients';

@Module({
  imports: [ConfigModule, ClientsModule.registerAsync([NATSClient])],
  providers: [FirebaseConfigService, FirebaseService],
  controllers: [FirebaseController],
  exports: [FirebaseService],
})
export class FirebaseModule {}
