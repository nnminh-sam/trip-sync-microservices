import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule } from '@nestjs/microservices';
import { Media } from '../../models';
import { NATSClient } from '../../client/clients';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import {
  GnuPgVerificationService,
  GcsUploadService,
  MediaUploadService,
} from './services';

@Module({
  imports: [
    TypeOrmModule.forFeature([Media]),
    ClientsModule.registerAsync([NATSClient]),
  ],
  controllers: [MediaController],
  providers: [
    MediaService,
    GnuPgVerificationService,
    GcsUploadService,
    MediaUploadService,
  ],
  exports: [
    MediaService,
    GnuPgVerificationService,
    GcsUploadService,
    MediaUploadService,
  ],
})
export class MediaModule {}
