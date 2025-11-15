import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RpcException } from '@nestjs/microservices';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';
import { RoleService } from 'src/modules/role/role.service';
import {
  REQUIRE_PERMISSION_KEY,
  RequirePermissionMetadata,
} from 'src/common/decorators/require-permission.decorator';
import { throwRpcException } from 'src/utils';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private roleService: RoleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler();
    const classRef = context.getClass();

    // Extract permission metadata from decorator
    const permissionMetadata =
      this.reflector.getAllAndOverride<RequirePermissionMetadata>(
        REQUIRE_PERMISSION_KEY,
        [handler, classRef],
      );

    // If no permission metadata is found, allow access (optional guard)
    if (!permissionMetadata) {
      return true;
    }

    // Extract MessagePayloadDto from RPC context
    const rpcContext = context.switchToRpc();
    const data = rpcContext.getData<MessagePayloadDto>();
    const { claims } = data;

    // Check if claims exist
    if (!claims) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required user claims',
      });
    }

    // Authorize using RoleService
    try {
      await this.roleService.authorizeClaims({
        claims,
        required: {
          roles: permissionMetadata.roles,
          permission: permissionMetadata.permission,
        },
      });
      return true;
    } catch (error) {
      // Re-throw RPC exceptions as-is
      if (error instanceof RpcException) {
        throw error;
      }
      // For other errors, wrap in RPC exception
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Authorization failed',
      });
    }
  }
}

