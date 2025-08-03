import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ClientModule } from 'src/client/client.module';

@Module({
  imports: [ClientModule],
  providers: [AuthService],
  controllers: [],
  exports: [AuthService],
})
export class AuthModule {}
