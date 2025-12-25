import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from '../../models';
import { MediaController } from './media.controller';
import { MediaService } from './services/media.service';
import {
  VerificationService,
  GcsUploadService,
  MediaUploadService,
} from './services';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Media]), AuthModule],
  controllers: [MediaController],
  providers: [
    MediaService,
    VerificationService,
    GcsUploadService,
    MediaUploadService,
  ],
  exports: [
    MediaService,
    VerificationService,
    GcsUploadService,
    MediaUploadService,
  ],
})
export class MediaModule {}
