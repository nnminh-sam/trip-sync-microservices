import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from 'src/models/permission.model';
import { throwRpcException } from 'src/utils';
import { CreatePermissionDto } from './dtos/create-permission.dto';
import { UpdatePermissionDto } from './dtos/update-permission.dto';
import { BulkCreatePermissionDto } from './dtos/bulk-create-permission.dto';
import { FilterPermissionDto } from 'src/modules/permission/dtos/filter-permission.dto';

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async onStartUp() {
    this.logger.log('Seeding default permissions if not exist...');
    const resources = ['role', 'permission', 'user'];
    const actions = ['create', 'read', 'update', 'delete'];
    for (const resource of resources) {
      for (const action of actions) {
        const exists = await this.permissionRepository.findOne({
          where: { action, resource },
        });
        if (!exists) {
          await this.permissionRepository.save(
            this.permissionRepository.create({
              action,
              resource,
              description: `${action} ${resource}`,
            }),
          );
          this.logger.log(`Created permission: ${action} ${resource}`);
        }
      }
    }
    const systemAdminPermissionIds: string[] = [];
    for (const resource of resources) {
      for (const action of actions) {
        const role = await this.permissionRepository.findOne({
          where: { action, resource },
          select: { id: true },
        });
        systemAdminPermissionIds.push(role.id);
      }
    }
    this.logger.log('Permission seeding completed.');
    return systemAdminPermissionIds;
  }

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    this.logger.log('Creating a new permission');
    try {
      const permission = this.permissionRepository.create(createPermissionDto);
      const savedPermission = await this.permissionRepository.save(permission);
      this.logger.log(`Permission created with id: ${savedPermission.id}`);
      return savedPermission;
    } catch (error) {
      this.logger.error('Failed to create permission', error.stack);
      throwRpcException({
        message: 'Failed to create permission',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async findAll(payload: FilterPermissionDto): Promise<Permission[]> {
    const { action, resource, page, size, order, sortBy } = payload;

    const skip = (page - 1) * size;
    const permissions = await this.permissionRepository.find({
      where: { ...(action && { action }), ...(resource && { resource }) },
      skip,
      order: {
        [sortBy]: order.toLowerCase() === 'asc' ? 1 : -1,
      },
    });
    this.logger.log(`Fetched ${permissions.length} permissions`);
    return permissions;
  }

  async findOne(id: string): Promise<Permission> {
    this.logger.log(`Fetching permission with id: ${id}`);
    const permission = await this.permissionRepository.findOne({
      where: { id },
      relations: ['rolePermissions', 'rolePermissions.role'],
    });

    if (!permission) {
      this.logger.warn(`Permission not found with id: ${id}`);
      throwRpcException({
        message: 'Permission not found',
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    this.logger.log(`Permission found with id: ${id}`);
    return permission;
  }

  async findByActionAndResource(
    action: string,
    resource: string,
  ): Promise<Permission> {
    this.logger.log(
      `Fetching permission with action: ${action}, resource: ${resource}`,
    );
    const permission = await this.permissionRepository.findOne({
      where: { action, resource },
      relations: ['rolePermissions', 'rolePermissions.role'],
    });

    if (!permission) {
      this.logger.warn(
        `Permission not found for action: ${action}, resource: ${resource}`,
      );
      throwRpcException({
        message: 'Permission not found',
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    this.logger.log(
      `Permission found for action: ${action}, resource: ${resource}`,
    );
    return permission;
  }

  async update(
    id: string,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    this.logger.log(`Updating permission with id: ${id}`);
    const permission = await this.findOne(id);

    try {
      Object.assign(permission, updatePermissionDto);
      const updatedPermission =
        await this.permissionRepository.save(permission);
      this.logger.log(`Permission updated with id: ${id}`);
      return updatedPermission;
    } catch (error) {
      this.logger.error(
        `Failed to update permission with id: ${id}`,
        error.stack,
      );
      throwRpcException({
        message: 'Failed to update permission',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Removing permission with id: ${id}`);
    const permission = await this.findOne(id);
    await this.permissionRepository.remove(permission);
    this.logger.log(`Permission removed with id: ${id}`);
  }

  async bulkCreate(
    bulkCreatePermissionDto: BulkCreatePermissionDto,
  ): Promise<Permission[]> {
    this.logger.log(
      `Bulk creating ${bulkCreatePermissionDto.permissions.length} permissions`,
    );
    try {
      const permissions = this.permissionRepository.create(
        bulkCreatePermissionDto.permissions,
      );
      const savedPermissions =
        await this.permissionRepository.save(permissions);
      this.logger.log(`Bulk created ${savedPermissions.length} permissions`);
      return savedPermissions;
    } catch (error) {
      this.logger.error('Failed to bulk create permissions', error.stack);
      throwRpcException({
        message: 'Failed to bulk create permissions',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }
}
