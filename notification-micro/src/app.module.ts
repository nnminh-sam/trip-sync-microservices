import { Module } from '@nestjs/common';
import { NotificationModule } from './modules/notification/notification.modulle';

@Module({
  imports: [NotificationModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
