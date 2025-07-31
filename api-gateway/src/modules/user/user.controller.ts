import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { RequestUserClaims } from 'src/common/decorators/request-user-claims.decorator';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { CreateUserDto } from 'src/modules/user/dtos/create-user.dto';
import { FilterUserDto } from 'src/modules/user/dtos/filter-user.dto';
import { UpdateUserDto } from 'src/modules/user/dtos/update-user.dto';
import { UserService } from 'src/modules/user/user.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ApiResponseConstruction } from 'src/common/decorators/api-response-construction.decorator';
import { User } from 'src/models/user.model';

@ApiTags('User')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user by access token' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Current user info',
    model: User,
  })
  async findByAccessToken(@RequestUserClaims() claims: TokenClaimsDto) {
    return await this.userService.findById(claims.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Find users' })
  @ApiResponseConstruction({
    status: 200,
    description: 'List of users',
    model: User,
    isArray: true,
  })
  @ApiBody({ type: FilterUserDto })
  async find(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Query() payload: FilterUserDto,
  ) {
    return await this.userService.find(claims, payload);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create user' })
  @ApiResponseConstruction({
    status: 201,
    description: 'User created',
    model: User,
  })
  @ApiBody({ type: CreateUserDto })
  async create(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() payload: CreateUserDto,
  ) {
    return await this.userService.create(claims, payload);
  }

  @Patch()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user' })
  @ApiResponseConstruction({
    status: 200,
    description: 'User updated',
    model: User,
  })
  @ApiBody({ type: UpdateUserDto })
  async update(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.update(claims, updateUserDto);
  }
}
