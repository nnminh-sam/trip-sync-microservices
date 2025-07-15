import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { ClientModule } from 'src/client/client.module';

@Module({
  imports: [ClientModule],
  providers: [RoleService],
  controllers: [RoleController],
})
export class RoleModule {}
