import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PERMISSION_KEY = 'requirePermission';

export interface RequirePermissionMetadata {
  roles: string[];
  permission: {
    action: string;
    resource: string;
  };
}

export const RequirePermission = (
  roles: string[],
  permission: { action: string; resource: string },
) => SetMetadata(REQUIRE_PERMISSION_KEY, { roles, permission } as RequirePermissionMetadata);

