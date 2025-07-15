import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from 'src/modules/auth/auth.service';
import { LoginDto } from 'src/modules/auth/dtos/login.dto';
import { AuthMessagePattern } from 'src/modules/auth/auth-message.pattern';
import { AuthorizeClaimsPayloadDto } from 'src/modules/role/dtos/authorize-claims-payload.dto';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(AuthMessagePattern.login)
  async login(@Payload() payload: MessagePayloadDto<LoginDto>) {
    return await this.authService.login(payload.request.body);
  }

  @MessagePattern(AuthMessagePattern.authorizeClaims)
  async authorizeClaims(
    @Payload() payload: MessagePayloadDto<AuthorizeClaimsPayloadDto>,
  ) {
    return await this.authService.authorizeClaims(payload.request.body);
  }
}
