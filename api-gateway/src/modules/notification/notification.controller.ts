import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponseConstruction } from 'src/common/decorators/api-response-construction.decorator';
import { RequestUserClaims } from 'src/common/decorators/request-user-claims.decorator';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { Notification } from 'src/models/notification.model';
import { CreateNotificationDto } from 'src/modules/notification/dtos/create-notification.dto';
import { FilterNotificationDto } from 'src/modules/notification/dtos/filter-notification.dto';
import { UpdateNotificationDto } from 'src/modules/notification/dtos/update-notification.dto';

@ApiBearerAuth()
@ApiTags('Notification')
@Controller('notifications')
export class NotificationController {
  constructor() {}

  @Get()
  @ApiOperation({ summary: 'List/Filter notifications' })
  @ApiResponseConstruction({
    status: 200,
    description: 'List of notifications',
    model: Notification,
    isArray: true,
  })
  @ApiBody({ type: FilterNotificationDto })
  async findAll(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() payload: FilterNotificationDto,
  ) {
    return { claims, payload };
  }

  @Post()
  @ApiOperation({ summary: 'Create notification' })
  @ApiResponseConstruction({
    status: 201,
    description: 'Notification created',
    model: Notification,
  })
  @ApiBody({ type: CreateNotificationDto })
  async create(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() payload: CreateNotificationDto,
  ) {
    return { claims, payload };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update notification' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Notification updated',
    model: Notification,
  })
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiBody({ type: UpdateNotificationDto })
  async update(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
    @Body() payload: UpdateNotificationDto,
  ) {
    return { claims, id, payload };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponseConstruction({
    status: 204,
    description: 'Notification deleted',
    model: Notification,
  })
  @ApiParam({
    name: 'id',
    type: String,
  })
  async delete(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ) {
    return { claims, id };
  }
}
