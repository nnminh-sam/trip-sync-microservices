import { BaseModel } from 'src/models/base.model';
import { Permission } from 'src/models/permission.model';
import { Role } from 'src/models/role.model';
import { RolePermission } from 'src/models/role-permission.model';
import { User } from 'src/models/user.model';

export const tableSchemas = [BaseModel, Permission, Role, RolePermission, User];
