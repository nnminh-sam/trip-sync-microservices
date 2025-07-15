import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dtos/create-permission.dto';
import { UpdatePermissionDto } from './dtos/update-permission.dto';
import { BulkCreatePermissionDto } from './dtos/bulk-create-permission.dto';
import { PublicRequest } from 'src/common/decorators/public-request.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FilterPermissionDto } from 'src/modules/permission/dtos/filter-permission.dto';
import { RequestUserClaims } from 'src/common/decorators/request-user-claims.decorator';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';

@ApiTags('Permission')
@Controller('permissions')
@UsePipes(new ValidationPipe({ transform: true }))
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create permission' })
  @ApiResponse({ status: 201, description: 'Permission created' })
  @ApiBody({ type: CreatePermissionDto })
  async create(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() createPermissionDto: CreatePermissionDto,
  ) {
    return await this.permissionService.create(claims, createPermissionDto);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk create permissions' })
  @ApiResponse({ status: 201, description: 'Permissions created' })
  @ApiBody({ type: BulkCreatePermissionDto })
  async bulkCreate(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() bulkCreatePermissionDto: BulkCreatePermissionDto,
  ) {
    return await this.permissionService.bulkCreate(
      claims,
      bulkCreatePermissionDto,
    );
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({ status: 200, description: 'List of permissions' })
  async findAll(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() payload: FilterPermissionDto,
  ) {
    return await this.permissionService.findAll(claims, payload);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiResponse({ status: 200, description: 'Permission details' })
  @ApiParam({ name: 'id', type: String })
  async findOne(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ) {
    return await this.permissionService.findOne(claims, id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update permission' })
  @ApiResponse({ status: 200, description: 'Permission updated' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdatePermissionDto })
  async update(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return await this.permissionService.update(claims, id, updatePermissionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete permission' })
  @ApiResponse({ status: 204, description: 'Permission deleted' })
  @ApiParam({ name: 'id', type: String })
  async remove(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ) {
    return await this.permissionService.remove(claims, id);
  }
}
