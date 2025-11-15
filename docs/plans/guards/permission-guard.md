# Permission Guard Implementation Plan

## Overview

Create a permission guard system for the user-micro service that allows declarative permission checks using decorators, replacing the current manual `roleService.authorizeClaims()` calls in controller methods.

## Current State

- Permission checks are done manually in `user.controller.ts` by calling `roleService.authorizeClaims()` in each method
- The `authorizeClaims` method requires: `claims` (TokenClaimsDto), `required.roles` (string[]), and `required.permission` (action + resource)
- Existing `LocalAuthGuard` extends `AuthGuard('local')` from Passport
- User-micro uses NestJS microservices with `@MessagePattern` decorators
- Claims are passed via `MessagePayloadDto.claims`

## Implementation

### 1. Create Permission Decorator

**File:** `user-micro/src/common/decorators/require-permission.decorator.ts`

- Create `@RequirePermission()` decorator using `SetMetadata`
- Accept parameters: `roles: string[]` and `permission: { action: string, resource: string }`
- Store metadata with a unique key (e.g., `REQUIRE_PERMISSION_KEY`)

### 2. Create Permission Guard

**File:** `user-micro/src/common/guards/permission.guard.ts`

- Implement `CanActivate` interface
- Inject `Reflector` and `RoleService`
- Extract permission metadata from handler/class using Reflector
- Extract `claims` from `MessagePayloadDto` in the microservice context
- Call `roleService.authorizeClaims()` with extracted data
- Handle RPC context (use `RpcExecutionContext` from `@nestjs/microservices`)
- Throw appropriate RPC exceptions on authorization failure

### 3. Update User Controller

**File:** `user-micro/src/modules/user/user.controller.ts`

- Replace manual `roleService.authorizeClaims()` calls with `@RequirePermission()` decorator
- Apply decorator to methods: `findAll`, `create`, `delete`, `deactivate`, `activate`
- Remove manual authorization code from these methods
- Keep `findById` and `update` as-is (they have different permission logic)

### 4. Register Guard (Optional)

- Consider if guard should be global or applied per-controller
- If global, register in `app.module.ts` using `APP_GUARD`
- If per-controller, use `@UseGuards(PermissionGuard)` decorator

## Files to Create

- `user-micro/src/common/decorators/require-permission.decorator.ts`
- `user-micro/src/common/guards/permission.guard.ts`

## Files to Modify

- `user-micro/src/modules/user/user.controller.ts` (replace manual checks with decorator)

## Technical Considerations

- Guard must work with NestJS microservice context (`RpcExecutionContext`)
- Extract `MessagePayloadDto` from `context.getData()` in microservice context
- Handle cases where `claims` might be undefined
- Maintain backward compatibility with existing error handling
- Follow existing patterns from `JwtGuard` in api-gateway for Reflector usage