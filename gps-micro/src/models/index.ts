import { BaseModel } from 'src/models/base.model';
import { Permission } from 'src/models/permission.model';
import { Role } from 'src/models/role.model';
import { RolePermission } from 'src/models/role-permission.model';
import { User } from 'src/models/user.model';
import { GPSLog } from 'src/models/gps-log.model';
import { CheckInOut } from 'src/models/check-in-out.model';
import { GPSExport } from 'src/models/gps-export.model';

export const tableSchemas = [
  BaseModel,
  Permission,
  Role,
  RolePermission,
  User,
  GPSLog,
  CheckInOut,
  GPSExport,
];
