import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RequestUserClaims } from 'src/common/decorators/request-user-claims.decorator';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { CreateUserDto } from 'src/modules/user/dtos/create-user.dto';
import { FilterUserDto } from 'src/modules/user/dtos/filter-user.dto';
import { UpdateUserDto } from 'src/modules/user/dtos/update-user.dto';
import { UserService } from 'src/modules/user/user.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
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
  async findById(@RequestUserClaims() claims: TokenClaimsDto) {
    return await this.userService.findById(claims);
  }

  @Get()
  @ApiBearerAuth()
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

  @Delete()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponseConstruction({
    status: 200,
    description: 'User deleted',
    model: User,
  })
  async delete(
    @Param('id') id: string,
    @RequestUserClaims() claims: TokenClaimsDto,
  ) {
    return await this.userService.delete(claims, id);
  }

  @Patch('deactivate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate user' })
  @ApiResponseConstruction({
    status: 200,
    description: 'User deactivated',
    model: User,
  })
  async deactivate(
    @Param('id') id: string,
    @RequestUserClaims() claims: TokenClaimsDto,
  ) {
    return await this.userService.deactivate(claims, id);
  }

  @Patch('activate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate user' })
  @ApiResponseConstruction({
    status: 200,
    description: 'User activated',
    model: User,
  })
  async activate(
    @Param('id') id: string,
    @RequestUserClaims() claims: TokenClaimsDto,
  ) {
    return await this.userService.activate(claims, id);
  }

  @Patch('my/public-key')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user public key' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Public key updated',
    model: User,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        publicKey: {
          type: 'string',
          description: 'GPG public key in armored format',
        },
      },
      required: ['publicKey'],
    },
  })
  async updatePublicKey(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body('publicKey') publicKey: string,
  ) {
    return await this.userService.updatePublicKey(claims, publicKey);
  }

  @Get('my/public-key')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user public key' })
  // @ApiResponseConstruction({
  //   status: 200,
  //   description: 'Public key retrieved',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       id: { type: 'string' },
  //       email: { type: 'string' },
  //       publicKey: { type: 'string' },
  //     },
  //   },
  // })
  async getPublicKey(@RequestUserClaims() claims: TokenClaimsDto) {
    return await this.userService.getPublicKey(claims);
  }
}
