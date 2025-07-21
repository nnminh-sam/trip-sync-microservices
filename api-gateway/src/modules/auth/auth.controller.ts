import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { PublicRequest } from 'src/common/decorators/public-request.decorator';
import { AuthService } from 'src/modules/auth/auth.service';
import { LoginDto } from 'src/modules/auth/dtos/login-payload.dto';
import { ExchangeTokenDto } from 'src/modules/auth/dtos/exchange-token.dto';
import { RequestUserClaims } from 'src/common/decorators/request-user-claims.decorator';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { AuthorizeClaimPayloadDto } from 'src/modules/auth/dtos/authorize-claim-payload.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ApiResponseConstruction } from 'src/common/decorators/api-response-construction.decorator';
import { AuthResponseDto } from 'src/modules/auth/dtos/auth-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @PublicRequest()
  @HttpCode(200)
  @ApiOperation({ summary: 'User login' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Login successful',
    model: AuthResponseDto,
  })
  @ApiBody({ type: LoginDto })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Logout successful',
    model: AuthResponseDto,
  })
  async logout(@RequestUserClaims() claims: TokenClaimsDto) {
    return this.authService.logout(claims);
  }

  @Post('/tokens/exchange')
  @PublicRequest()
  @ApiOperation({ summary: 'Exchange tokens' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Token exchange successful',
    model: AuthResponseDto,
  })
  @ApiBody({ type: ExchangeTokenDto })
  async exchangeToken(@Body() payload: ExchangeTokenDto) {
    return await this.authService.exchangeTokens(payload);
  }

  @Post('authorize-claims')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Authorize claims' })
  @ApiResponse({ status: 200, description: 'Claims authorized' })
  @ApiBody({ type: AuthorizeClaimPayloadDto })
  async authorizeClaims(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() payload: AuthorizeClaimPayloadDto,
  ) {
    return await this.authService.authorizeClaims(claims, payload);
  }
}
