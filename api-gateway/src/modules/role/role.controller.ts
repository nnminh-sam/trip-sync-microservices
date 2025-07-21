import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  UsePipes,
  Patch,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dtos/create-role.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { FilterRoleDto } from 'src/modules/role/dtos/filter-role.dto';
import { RequestUserClaims } from 'src/common/decorators/request-user-claims.decorator';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { ApiResponseConstruction } from 'src/common/decorators/api-response-construction.decorator';
import { Role } from 'src/models/role.model';

@ApiTags('Role')
@Controller('roles')
@UsePipes(new ValidationPipe({ transform: true }))
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create role' })
  @ApiResponseConstruction({
    status: 201,
    description: 'Role created',
    model: Role,
  })
  @ApiBody({ type: CreateRoleDto })
  async create(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() createRoleDto: CreateRoleDto,
  ) {
    return await this.roleService.create(claims, createRoleDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponseConstruction({
    status: 200,
    description: 'List of roles',
    model: Role,
    isArray: true,
  })
  async findAll(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() payload: FilterRoleDto,
  ) {
    return await this.roleService.findAll(claims, payload);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Role details',
    model: Role,
  })
  @ApiParam({ name: 'id', type: String })
  async findOne(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ) {
    return await this.roleService.findOne(claims, id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update role' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Role updated',
    model: Role,
  })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateRoleDto })
  async update(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return await this.roleService.update(claims, id, updateRoleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete role' })
  @ApiResponseConstruction({
    status: 204,
    description: 'Role deleted',
    model: Role,
  })
  @ApiParam({ name: 'id', type: String })
  async remove(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ) {
    return await this.roleService.remove(claims, id);
  }
}
