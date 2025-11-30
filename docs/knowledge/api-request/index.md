# API Request Flow Documentation

## Overview

This document describes how an HTTP request flows through the entire microservices system, from client to database and back.

---

## Complete Request-Response Flow

### Example: User Creates Another User

```
Client (Web/Mobile)
    │
    ├─ Request: POST /users
    │  Headers: Authorization: Bearer <jwt_token>
    │  Body: { firstName: "John", email: "john@example.com", ... }
    │
    ↓
API Gateway (Port 3000)
    │
    ├─ Step 1: Route to UserController
    │  ┌──────────────────────────────────────────────────┐
    │  │ @Post()                                          │
    │  │ async create(                                    │
    │  │   @RequestUserClaims() claims: TokenClaimsDto, │
    │  │   @Body() createUserDto: CreateUserDto          │
    │  │ )                                                │
    │  └──────────────────────────────────────────────────┘
    │
    ├─ Step 2: Global Guards
    │  ┌──────────────────────────────────────────────────┐
    │  │ 1. JwtGuard.canActivate()                        │
    │  │    - Extract Bearer token                        │
    │  │    - Verify JWT signature                        │
    │  │    - Check Redis for blacklisted token           │
    │  │    - Call user-micro to verify user exists       │
    │  │    - Inject claims into request.user             │
    │  │                                                  │
    │  │ 2. @RequestUserClaims() decorator extracts       │
    │  │    claims from request object                    │
    │  └──────────────────────────────────────────────────┘
    │
    ├─ Step 3: Global Pipes (Validation)
    │  ┌──────────────────────────────────────────────────┐
    │  │ ValidationPipe.transform()                       │
    │  │ - Validate createUserDto against decorators:     │
    │  │   @IsEmail() email: string;                      │
    │  │   @MinLength(2) firstName: string;               │
    │  │ - Transform to proper types                      │
    │  │ - Throw BadRequestException if invalid           │
    │  └──────────────────────────────────────────────────┘
    │
    ├─ Step 4: Delegate to UserService
    │  ┌──────────────────────────────────────────────────┐
    │  │ this.userService.create(claims, createUserDto)   │
    │  └──────────────────────────────────────────────────┘
    │
    ├─ Step 5: Send RPC Call via NATS
    │  │ UserService.create() calls:
    │  │ natsClient.send('user.create', payload)
    │  │
    │  │ payload = {
    │  │   claims: {
    │  │     sub: "user-123",        // User ID
    │  │     email: "admin@...",
    │  │     roles: ["admin"],
    │  │     jti: "token-uuid",      // Token ID
    │  │     exp: 1234567890         // Expiry timestamp
    │  │   },
    │  │   request: {
    │  │     body: {
    │  │       firstName: "John",
    │  │       email: "john@example.com"
    │  │     }
    │  │   }
    │  │ }
    │
    │  ├─ Transport: NATS (Message Queue)
    │  │  NATS_SERVER: nats://localhost:4222
    │  │
    │  ├─ Message Pattern: 'user.create'
    │  │  (defined in user-micro/user-message.pattern.ts)
    │  │
    │  └─ Timeout: 30 seconds (from client config)
    │
    ↓
User Microservice (Port 3001)
    │
    ├─ Step 6: Route to Handler by Message Pattern
    │  ┌──────────────────────────────────────────────────┐
    │  │ @MessagePattern(UserMessagePattern.create)       │
    │  │ async create(@Payload() payload: MessagePayloadDto<CreateUserDto>)
    │  └──────────────────────────────────────────────────┘
    │
    ├─ Step 7: Permission Check
    │  ┌──────────────────────────────────────────────────┐
    │  │ @RequirePermission(['admin'], {                  │
    │  │   action: 'create',                              │
    │  │   resource: 'user'                               │
    │  │ })                                               │
    │  │                                                  │
    │  │ PermissionGuard.canActivate():                   │
    │  │ - Extract claims from payload                    │
    │  │ - Check user's roles in PermissionService        │
    │  │ - Verify user has 'create.user' permission       │
    │  │ - Throw ForbiddenException if denied             │
    │  └──────────────────────────────────────────────────┘
    │
    ├─ Step 8: Execute Service Logic
    │  │ UserService.create(createUserDto):
    │  │
    │  │ 1. Validate role exists
    │  │    roleService.findById(createUserDto.roleId)
    │  │
    │  │ 2. Hash password
    │  │    await bcrypt.hash(password, 10)
    │  │
    │  │ 3. Create User entity
    │  │    userRepository.create({
    │  │      firstName: "John",
    │  │      email: "john@example.com",
    │  │      password: "<hashed>",
    │  │      roleId: "<uuid>"
    │  │    })
    │  │
    │  │ 4. Save to database
    │  │    userRepository.save(userEntity)
    │  │
    │  │ 5. Async audit logging (fire-and-forget)
    │  │    auditLogService.log(claims, { ... }).catch(...)
    │  │
    │  └─ Returns: User object (with id, email, etc.)
    │
    ├─ Step 9: Query Database
    │  ├─ Database: MySQL (user_service_db)
    │  │
    │  ├─ SQL: INSERT INTO users (id, firstName, email, password, roleId, ...)
    │  │
    │  ├─ Response: New user with auto-generated:
    │  │  - id: UUID
    │  │  - createdAt: Current timestamp
    │  │  - updatedAt: Current timestamp
    │  │
    │  └─ Also INSERT audit log record:
    │     INSERT INTO audit_logs (userId, action, resource, ...)
    │
    ↓
User Microservice → API Gateway (NATS Response)
    │
    │ Returns: {
    │   id: "user-456",
    │   firstName: "John",
    │   email: "john@example.com",
    │   role: { id: "role-123", name: "User", ... },
    │   createdAt: "2025-11-30T10:00:00Z",
    │   updatedAt: "2025-11-30T10:00:00Z"
    │ }
    │
    ↓
API Gateway (Port 3000)
    │
    ├─ Step 10: Handle RPC Response
    │  ├─ UserService receives response
    │  ├─ Check for RpcException
    │  └─ Return user object to controller
    │
    ├─ Step 11: Global Response Interceptor
    │  ┌──────────────────────────────────────────────────┐
    │  │ ResponseWrapperInterceptor.intercept()           │
    │  │                                                  │
    │  │ Input: { id: "...", firstName: "John", ... }    │
    │  │                                                  │
    │  │ Output: {                                        │
    │  │   timestamp: "2025-11-30T10:00:00Z",            │
    │  │   path: "/users",                               │
    │  │   method: "POST",                               │
    │  │   statusCode: 201,                              │
    │  │   data: { id: "...", firstName: "John", ... }   │
    │  │ }                                                │
    │  └──────────────────────────────────────────────────┘
    │
    ├─ Step 12: Send HTTP Response
    │  └─ Status: 201 Created
    │
    ↓
Client (Web/Mobile)
    │
    │ HTTP Response:
    │ {
    │   timestamp: "2025-11-30T10:00:00Z",
    │   path: "/users",
    │   method: "POST",
    │   statusCode: 201,
    │   data: {
    │     id: "user-456",
    │     firstName: "John",
    │     email: "john@example.com",
    │     role: { id: "role-123", name: "User", ... },
    │     createdAt: "2025-11-30T10:00:00Z",
    │     updatedAt: "2025-11-30T10:00:00Z"
    │   }
    │ }
    │
    └─ End of Flow
```

---

## Error Handling Flow

### Example: Invalid JWT Token

```
Client
    │
    ├─ Request: GET /users
    │  Headers: Authorization: Bearer <invalid_or_expired_token>
    │
    ↓
API Gateway
    │
    ├─ Step 1: JwtGuard.canActivate()
    │  ├─ Extract token from Authorization header
    │  ├─ Call JwtStrategy.validate()
    │  │
    │  └─ JwtModule.verify() throws:
    │     JsonWebTokenError("jwt malformed")
    │
    ├─ Step 2: AuthGuard catches error
    │  └─ Returns false → Access Denied
    │
    ├─ Step 3: Global Exception Filter
    │  └─ HttpExceptionFilter.catch(UnauthorizedException)
    │
    ├─ Step 4: Send HTTP Error Response
    │
    ↓
Client
    │
    │ HTTP 401 Unauthorized:
    │ {
    │   timestamp: "2025-11-30T10:00:00Z",
    │   path: "/users",
    │   status: "error",
    │   statusCode: 401,
    │   message: "Unauthorized"
    │ }
    │
    └─ End
```

---

## Error Handling Flow: RPC Timeout

### Example: User Microservice is Down

```
Client
    │
    ├─ Request: GET /users
    │  Headers: Authorization: Bearer <valid_token>
    │
    ↓
API Gateway
    │
    ├─ Step 1: JwtGuard validates token ✓
    │
    ├─ Step 2: UserController.find()
    │  └─ Calls userService.find()
    │
    ├─ Step 3: UserService sends RPC
    │  │ natsClient.send('user.find', payload)
    │  │
    │  └─ Waits up to 30 seconds for response
    │
    ├─ Step 4: No response (User Microservice down)
    │  └─ Timeout error: "User service unavailable"
    │
    ├─ Step 5: @CatchErrors decorator catches
    │  ├─ Check error type
    │  └─ Throw InternalServerErrorException
    │
    ├─ Step 6: Global Exception Filter
    │  └─ RpcExceptionFilter.catch()
    │
    ├─ Step 7: Send HTTP Error Response
    │
    ↓
Client
    │
    │ HTTP 500 Internal Server Error:
    │ {
    │   timestamp: "2025-11-30T10:00:00Z",
    │   path: "/users",
    │   status: "error",
    │   statusCode: 500,
    │   message: "User service unavailable"
    │ }
    │
    └─ End
```

---

## Error Handling Flow: Permission Denied

### Example: Non-Admin Tries to Create User

```
Client
    │
    ├─ Request: POST /users
    │  Headers: Authorization: Bearer <user_token> (User role, not Admin)
    │  Body: { firstName: "John", ... }
    │
    ↓
API Gateway
    │
    ├─ Step 1: JwtGuard validates token ✓
    │  └─ claims.roles = ['user']
    │
    ├─ Step 2: RPC call to user-micro
    │  └─ Send 'user.create' with claims
    │
    ↓
User Microservice
    │
    ├─ Step 3: PermissionGuard.canActivate()
    │  │ @RequirePermission(['admin'], { action: 'create', resource: 'user' })
    │  │
    │  ├─ Check claims.roles
    │  └─ User has role 'user', not 'admin' ✗
    │
    ├─ Step 4: Throw ForbiddenException
    │  └─ Error is serialized and sent back via NATS
    │
    ├─ Response: {
    │    statusCode: 403,
    │    message: "Access Denied"
    │  }
    │
    ↓
API Gateway
    │
    ├─ Step 5: RpcExceptionFilter.catch()
    │  └─ Extract error details
    │
    ├─ Step 6: Send HTTP Error Response
    │
    ↓
Client
    │
    │ HTTP 403 Forbidden:
    │ {
    │   timestamp: "2025-11-30T10:00:00Z",
    │   path: "/users",
    │   status: "error",
    │   statusCode: 403,
    │   message: "Access Denied"
    │ }
    │
    └─ End
```

---

## Communication Details

### NATS Message Structure

When API Gateway calls user-micro via NATS:

```typescript
// Client sends:
natsClient.send('user.find', {
  claims: { sub: "123", roles: ["admin"], ... },
  request: { body: null, param: { page: 1 } }
})

// Server (user-micro) receives via @MessagePattern handler:
@MessagePattern('user.find')
async find(@Payload() payload: MessagePayloadDto<FilterUserDto>) {
  // payload.claims = { sub: "123", roles: ["admin"], ... }
  // payload.request.param = { page: 1 }
}

// Server sends back:
return { data: [...users], pagination: { page: 1, ... } }
```

### Message Payload Structure

```typescript
export class MessagePayloadDto<T = null> {
  // JWT claims from client's token
  claims?: TokenClaimsDto;  // { sub, email, roles, jti, exp, ... }

  // Request data
  request?: {
    body?: T;                          // POST/PATCH body
    path?: Record<string, any>;        // URL path params (/users/:id)
    param?: Record<string, any>;       // Query params (?page=1&size=10)
  };
}
```

---

## Response Format Standardization

### Standard HTTP Response Structure

Every response from API Gateway follows this format:

```typescript
{
  timestamp: string;        // "2025-11-30T10:00:00Z"
  path: string;            // "/users/123"
  method: string;          // "GET", "POST", etc
  statusCode: number;      // 200, 201, 400, 404, etc
  data?: T | T[];          // Response payload
  pagination?: {           // Only for list endpoints
    page: number;
    size: number;
    totalPages: number;
  };
  metadata?: Record<string, any>;  // Optional extra data
}
```

### Error Response Structure

```typescript
{
  timestamp: string;        // "2025-11-30T10:00:00Z"
  path: string;            // "/users"
  status: "error";
  statusCode: number;      // 400, 401, 403, 404, 500, etc
  message: string;         // Error message
  details?: any;           // Optional error details
}
```

---

## Key Points to Remember

1. **Single Entry Point**: All client requests go through API Gateway (port 3000)
2. **Microservice Communication**: Gateway talks to services via NATS (asynchronous)
3. **JWT Token**: Client must send `Authorization: Bearer <token>` header
4. **Token Validation**: Every request validated by JwtGuard + JwtStrategy
5. **Async Logging**: Audit logs are fire-and-forget (doesn't block response)
6. **Timeout**: NATS calls timeout after 30 seconds by default
7. **Error Propagation**: Microservice errors are caught and converted to HTTP errors
8. **Response Wrapping**: All responses wrapped by ResponseWrapperInterceptor
9. **Permission Check**: Microservices validate permissions, not gateway
10. **Database**: Only microservices access databases, not gateway

---

## Sequence Diagram

```
Client          API Gateway       User Micro      MySQL
  │                 │                │             │
  ├─ POST /users ──>│                │             │
  │                 │                │             │
  │             JwtGuard             │             │
  │             Validates            │             │
  │                 │                │             │
  │                 ├─ RPC 'user.create' ──>│     │
  │                 │                │             │
  │                 │            Permission      │
  │                 │            Validation      │
  │                 │                │             │
  │                 │            userService     │
  │                 │            .create()       │
  │                 │                ├──> INSERT USER
  │                 │                │             │
  │                 │            auditLogService <┘
  │                 │            .log() (async)  │
  │                 │                │             │
  │                 │            Returns User    │
  │                 │<─ RPC Response ────        │
  │                 │                │             │
  │             Response              │             │
  │             Interceptor           │             │
  │                 │                │             │
  │<─ HTTP 201 ─────┤                │             │
  │   {data: {...}} │                │             │
  │                 │                │             │
```

---

## What This Means for Media Service

When building media-service, you'll need to:

1. **Follow same RPC pattern**: Use `@MessagePattern` decorators
2. **Accept MessagePayloadDto**: Receive claims + request data
3. **Send back data**: Microservice returns data directly
4. **Let Gateway wrap**: API Gateway will wrap response
5. **Handle errors**: Throw exceptions that convert to HTTP errors
6. **Async logging**: Use fire-and-forget audit logging
7. **Check permissions**: Use permission guards in handlers
8. **Call other services**: Can make RPC calls to user-micro if needed
