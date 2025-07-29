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
import { CreateNotificationDto } from './dtos/create-notification.dto';
import { FilterNotificationDto } from './dtos/filter-notification.dto';
import { MarkReadNotificationDto } from './dtos/mark-read-notification.dto';
import { Notification } from 'src/models';

@ApiBearerAuth()
@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor() {}

  @Get()
  @ApiOperation({ summary: 'List/filter notifications' })
  @ApiResponseConstruction({
    status: 200,
    description: 'List of notifications',
    isArray: true,
    model: Notification,
  })
  async findAll(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Query() payload: FilterNotificationDto,
  ) {
    return { claims, payload };
  }

  @Post()
  @ApiOperation({ summary: 'Create/send notification' })
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
  @ApiOperation({ summary: 'Mark as read' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Notification marked as read',
    model: Notification,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Notification ID',
  })
  @ApiBody({ type: MarkReadNotificationDto })
  async markRead(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
    @Body() payload: MarkReadNotificationDto,
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
    description: 'Notification ID',
  })
  async delete(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ) {
    return { claims, id };
  }
}
