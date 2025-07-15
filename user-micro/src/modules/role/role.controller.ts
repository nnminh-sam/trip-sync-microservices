import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dtos/create-role.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';
import { RoleMessagePattern } from 'src/modules/role/role-message.pattern';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';
import { FilterRoleDto } from 'src/modules/role/dtos/filter-role.dto';
import { throwRpcException } from 'src/utils';

@Controller()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @MessagePattern(RoleMessagePattern.CREATE)
  async create(@Payload() payload: MessagePayloadDto<CreateRoleDto>) {
    await this.roleService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin', 'manager'],
        permission: {
          action: 'create',
          resource: 'role',
        },
      },
    });
    return await this.roleService.create(payload.request.body);
  }

  @MessagePattern(RoleMessagePattern.FIND_ALL)
  async findAll(@Payload() payload: MessagePayloadDto<FilterRoleDto>) {
    await this.roleService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin', 'manager'],
        permission: {
          action: 'read',
          resource: 'role',
        },
      },
    });
    return await this.roleService.findAll(payload.request.body);
  }

  @MessagePattern(RoleMessagePattern.FIND_ONE)
  async findOne(@Payload() payload: MessagePayloadDto) {
    await this.roleService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin', 'manager'],
        permission: {
          action: 'read',
          resource: 'role',
        },
      },
    });
    const { id } = payload.request.path;
    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required Role ID',
      });
    }
    return await this.roleService.findOne(id);
  }

  @MessagePattern(RoleMessagePattern.FIND_BY_NAME)
  async findByName(@Payload() payload: MessagePayloadDto<string>) {
    await this.roleService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin', 'manager'],
        permission: {
          action: 'read',
          resource: 'role',
        },
      },
    });
    const { name } = payload.request.path;
    if (!name) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required Role Name',
      });
    }

    return await this.roleService.findByName(name);
  }

  @MessagePattern(RoleMessagePattern.UPDATE)
  async update(@Payload() payload: MessagePayloadDto<UpdateRoleDto>) {
    await this.roleService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin', 'manager'],
        permission: {
          action: 'update',
          resource: 'role',
        },
      },
    });

    const { id } = payload.request.path;
    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required Role ID',
      });
    }

    return await this.roleService.update(id, payload.request.body);
  }

  @MessagePattern(RoleMessagePattern.REMOVE)
  async remove(@Payload() payload: MessagePayloadDto<string>) {
    await this.roleService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin', 'manager'],
        permission: {
          action: 'delete',
          resource: 'role',
        },
      },
    });

    const { id } = payload.request.path;
    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required Role ID',
      });
    }
    return await this.roleService.remove(id);
  }
}
