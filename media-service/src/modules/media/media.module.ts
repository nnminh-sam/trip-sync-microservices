import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from '../../models';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import {
  GnuPgVerificationService,
  GcsUploadService,
  MediaUploadService,
} from './services';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Media]),
    AuthModule,
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
