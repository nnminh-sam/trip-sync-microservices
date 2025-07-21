import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from 'src/models/role.model';
import { RolePermission } from 'src/models/role-permission.model';
import { Permission } from 'src/models/permission.model';
import { paginateAndOrder, throwRpcException } from 'src/utils';
import { CreateRoleDto } from './dtos/create-role.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';
import { AuthorizeClaimsPayloadDto } from 'src/modules/role/dtos/authorize-claims-payload.dto';
import { FilterRoleDto } from 'src/modules/role/dtos/filter-role.dto';
import { ListDataDto } from 'src/dtos/list-data.dto';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async onStartUp(systemAdminPermissionIds: string[]) {
    this.logger.log('Seeding default roles if not exist...');
    const createRoleDto: CreateRoleDto = {
      name: 'system admin',
      description: 'System Admin role with fully control of the system.',
      permissionIds: systemAdminPermissionIds,
    };
    const existingRole = await this.roleRepository.exists({
      where: { name: createRoleDto.name },
    });
    if (!existingRole) {
      await this.create(createRoleDto);
      this.logger.log('System admin role created');
    }

    // TODO: change the permission role's permissions
    const createManagerRoleDto: CreateRoleDto = {
      name: 'manager',
      description: 'Manager role of the system.',
      permissionIds: systemAdminPermissionIds,
    };
    const existingManagerRole = await this.roleRepository.exists({
      where: { name: createManagerRoleDto.name },
    });
    if (!existingManagerRole) {
      await this.create(createManagerRoleDto);
      this.logger.log('Manager role created');
    }

    // TODO: change the permission role's permissions
    const createEmployeeRoleDto: CreateRoleDto = {
      name: 'employee',
      description: 'Employee role of the system.',
      permissionIds: systemAdminPermissionIds,
    };
    const existingEmployeeRole = await this.roleRepository.exists({
      where: { name: createEmployeeRoleDto.name },
    });
    if (!existingEmployeeRole) {
      await this.create(createEmployeeRoleDto);
      this.logger.log('Employee role created');
    }
    this.logger.log('Role seeding completed.');
  }

  private async validateRequiredRoleAndPermission(
    roles: string[],
    permission: { action: string; resource: string },
  ) {
    this.logger.log(
      `Validating required roles and permission (${permission.action}:${permission.resource})`,
    );

    // Fetch all roles in parallel and wait for all to complete
    const existingRolesInDb: Role[] = await Promise.all(
      roles.map(async (role: string) => {
        const existingRoleInDb = await this.roleRepository.findOne({
          where: { name: role },
          relations: ['rolePermissions', 'rolePermissions.permission'],
        });

        if (!existingRoleInDb) {
          this.logger.error(
            'Invalid Required Role! Unknown Required Role Value',
          );
          throwRpcException({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Internal Server Error',
          });
        }

        return existingRoleInDb;
      }),
    );

    existingRolesInDb.forEach((role: Role) => {
      const hasPermission = role.rolePermissions.some(
        (rolePermission) =>
          rolePermission.permission.action === permission.action &&
          rolePermission.permission.resource === permission.resource,
      );

      if (!hasPermission) {
        this.logger.error(
          `Required Role ${role.name} Does Not Have Required Permission!`,
        );
        throwRpcException({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal Server Error',
        });
      }
    });

    return true;
  }

  async authorizeClaims(payload: AuthorizeClaimsPayloadDto) {
    const { claims, required } = payload;

    const claimedRole = claims.role;
    if (!claimedRole) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid Token',
      });
    }

    await this.validateRequiredRoleAndPermission(
      required.roles,
      required.permission,
    );

    if (!required.roles.includes(claimedRole)) {
      throwRpcException({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Forbidden: Insufficient role',
      });
    }

    this.logger.log(
      `Authorized for user (${claims.email}) with role (${claims.role}) to perform action (${required.permission.action}) on resource (${required.permission.resource})`,
    );

    return true;
  }

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    this.logger.log('Creating a new role');
    try {
      const { permissionIds, ...roleData } = createRoleDto;

      // Validate permissions if provided
      if (permissionIds && permissionIds.length > 0) {
        await this.validatePermissionIds(permissionIds);
      }

      const role = this.roleRepository.create(roleData);
      const savedRole = await this.roleRepository.save(role);

      // Assign permissions if provided
      if (permissionIds && permissionIds.length > 0) {
        await this.assignPermissionsToRole(savedRole.id, permissionIds);
      }

      // Return the role with permissions
      const roleWithPermissions = await this.findOne(savedRole.id);
      this.logger.log(`Role created with id: ${savedRole.id}`);
      return roleWithPermissions;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        this.logger.warn('Role name already exists');
        throwRpcException({
          message: 'Role name already exists',
          statusCode: HttpStatus.CONFLICT,
        });
      }
      this.logger.error('Failed to create role', error.stack);
      throwRpcException({
        message: 'Failed to create role',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async findAll(payload: FilterRoleDto) {
    this.logger.log('Fetching all roles');
    const { name, sortBy, order, page, size } = payload;

    const [roles, total] = await this.roleRepository.findAndCount({
      where: { ...(name && { name }) },
      relations: ['rolePermissions', 'rolePermissions.permission'],
      ...paginateAndOrder({
        page,
        size,
        order,
        sortBy,
      }),
    });
    const result = ListDataDto.build<Role>({
      data: roles,
      page,
      size,
      total,
    });
    this.logger.log(`Fetched ${roles.length} roles`);
    return result;
  }

  async findOne(id: string): Promise<Role> {
    this.logger.log(`Fetching role with id: ${id}`);
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });

    if (!role) {
      this.logger.warn(`Role not found with id: ${id}`);
      throwRpcException({
        message: 'Role not found',
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    this.logger.log(`Role found with id: ${id}`);
    return role;
  }

  async findByName(name: string): Promise<Role> {
    this.logger.log(`Fetching role with name: ${name}`);
    const role = await this.roleRepository.findOne({
      where: { name },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });

    if (!role) {
      this.logger.warn(`Role not found with name: ${name}`);
      throwRpcException({
        message: 'Role not found',
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    this.logger.log(`Role found with name: ${name}`);
    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    this.logger.log(`Updating role with id: ${id}`);
    const role = await this.findOne(id);

    try {
      const { permissionIds, ...roleData } = updateRoleDto;

      // Validate permissions if provided
      if (permissionIds !== undefined && permissionIds.length > 0) {
        await this.validatePermissionIds(permissionIds);
      }

      // Update role data
      Object.assign(role, roleData);
      await this.roleRepository.save(role);

      // Update permissions if provided
      if (permissionIds !== undefined) {
        await this.updateRolePermissions(id, permissionIds);
      }

      // Return the updated role with permissions
      const roleWithPermissions = await this.findOne(id);
      this.logger.log(`Role updated with id: ${id}`);
      return roleWithPermissions;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        this.logger.warn('Role name already exists');
        throwRpcException({
          message: 'Role name already exists',
          statusCode: HttpStatus.CONFLICT,
        });
      }
      this.logger.error(`Failed to update role with id: ${id}`, error.stack);
      throwRpcException({
        message: 'Failed to update role',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Removing role with id: ${id}`);
    const role = await this.findOne(id);
    await this.roleRepository.remove(role);
    this.logger.log(`Role removed with id: ${id}`);
  }

  private async validatePermissionIds(permissionIds: string[]): Promise<void> {
    this.logger.log(`Validating ${permissionIds.length} permission IDs`);

    const foundPermissions = await this.permissionRepository.find({
      where: permissionIds.map((id) => ({ id })),
    });

    if (foundPermissions.length !== permissionIds.length) {
      const foundIds = foundPermissions.map((p) => p.id);
      const missingIds = permissionIds.filter((id) => !foundIds.includes(id));

      this.logger.warn(`Invalid permission IDs: ${missingIds.join(', ')}`);
      throwRpcException({
        message: `Invalid permission IDs: ${missingIds.join(', ')}`,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    this.logger.log('All permission IDs are valid');
  }

  private async assignPermissionsToRole(
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    this.logger.log(
      `Assigning ${permissionIds.length} permissions to role ${roleId}`,
    );

    const rolePermissions = permissionIds.map((permissionId) =>
      this.rolePermissionRepository.create({
        roleId,
        permissionId,
      }),
    );

    await this.rolePermissionRepository.save(rolePermissions);
    this.logger.log(`Successfully assigned permissions to role ${roleId}`);
  }

  private async updateRolePermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    this.logger.log(`Updating permissions for role ${roleId}`);

    // Remove existing permissions
    await this.rolePermissionRepository.delete({ roleId });

    // Add new permissions if any
    if (permissionIds.length > 0) {
      await this.assignPermissionsToRole(roleId, permissionIds);
    }

    this.logger.log(`Successfully updated permissions for role ${roleId}`);
  }
}
