# API Gateway Documentation

## Overview

The API Gateway is the **single entry point** for all external clients (web, mobile). It:
- Handles HTTP requests
- Validates JWT tokens
- Routes requests to microservices via NATS
- Manages response formatting and error handling
- Maintains token blacklist (Redis)

- **Location**: `api-gateway/src`
- **Database**: Redis (token blacklist only, no TypeORM)
- **Communication**: HTTP (REST for clients) + NATS (RPC to microservices)
- **Port**: Configurable via `APP_PORT` env var

---

## Architecture

### Boot Process (`api-gateway/src/main.ts`)

```typescript
const app = await NestFactory.create(AppModule, {
  logger: WinstonModule.createLogger({
    // Structured logging to file + console
  })
});

// Swagger API documentation
SwaggerModule.setup('api-document', app, document);

// Global middleware
app.useGlobalInterceptors(new LoggingInterceptor());
app.useGlobalInterceptors(new ResponseWrapperInterceptor());
app.useGlobalPipes(new ValidationPipe({ ... }));
app.useGlobalFilters(new HttpExceptionFilter());
app.useGlobalFilters(new RpcExceptionFilter());

// Connect to NATS
await app.get('NATS_SERVICE').connect();

await app.listen(port);
```

The gateway:
- **Listens on HTTP**: Accepts requests from clients
- **Connects to NATS**: Sends RPC calls to microservices
- **Uses Redis**: Caches token blacklist for instant logout

---

## Directory Structure

```
api-gateway/src/
├── main.ts                          # Entry point (HTTP + NATS bootstrap)
├── app.module.ts                    # Root module with all imports
├── app.controller.ts
├── config/                          # Environment & validation config
│   ├── configuration.ts             # Joi validation schema
│   └── index.ts
├── client/                          # NATS client configuration
│   ├── client.module.ts
│   └── clients.ts
├── database/                        # Redis configuration (NO TypeORM)
│   ├── database.module.ts
│   └── redis.service.ts
├── models/                          # Response DTOs (not entities)
│   ├── base.model.ts               # Base response model with @ApiProperty
│   ├── user.model.ts               # For Swagger docs
│   ├── task.model.ts
│   ├── trip.model.ts
│   ├── enums/
│   │   ├── gender.enum.ts
│   │   ├── media-type.enum.ts
│   │   └── task-status.enum.ts
│   └── index.ts                    # Barrel exports
├── common/                          # Global utilities
│   ├── decorators/
│   │   ├── api-response-construction.decorator.ts  # Swagger @ApiResponse
│   │   ├── public-request.decorator.ts             # Skip JWT auth
│   │   └── request-user-claims.decorator.ts        # Extract JWT user
│   ├── filters/
│   │   ├── http-exception.filter.ts  # Handle HTTP errors
│   │   └── rpc-exception.filter.ts   # Convert RPC errors to HTTP
│   ├── guards/
│   │   └── jwt.guard.ts             # Global JWT guard with public bypass
│   ├── interceptors/
│   │   ├── logging.interceptor.ts   # Log requests/responses
│   │   └── response-wrapper.interceptor.ts  # Standardize response format
│   └── services/
│       └── nats-client.service.ts   # Helper for NATS calls
├── dtos/                            # Data Transfer Objects
│   ├── api-response.dto.ts          # Standard HTTP response envelope
│   ├── message-payload.dto.ts       # RPC request to microservices
│   ├── token-claims.dto.ts          # JWT token structure
│   ├── base-request-filter.dto.ts   # Pagination/filtering
│   └── paginated-response.dto.ts
├── modules/                         # Feature modules (HTTP routers)
│   ├── auth/
│   │   ├── auth.module.ts           # AuthController + AuthService
│   │   ├── auth.controller.ts       # @Post /login, @Post /logout
│   │   ├── auth.service.ts          # JWT + Redis integration
│   │   ├── auth-message.pattern.ts  # RPC patterns called
│   │   ├── dtos/
│   │   │   ├── login.dto.ts
│   │   │   └── register.dto.ts
│   │   └── strategies/
│   │       └── jwt.strategy.ts      # Passport JWT validation
│   ├── user/
│   │   ├── user.module.ts
│   │   ├── user.controller.ts       # @Get, @Post, @Patch, @Delete
│   │   ├── user.service.ts          # RPC delegation to user-micro
│   │   ├── user-message.pattern.ts  # RPC patterns
│   │   └── dtos/
│   ├── task/
│   ├── trip/
│   ├── location/
│   ├── gps/
│   ├── task-proof/
│   ├── permission/
│   ├── role/
│   └── audit/
├── utils/
│   └── index.ts                     # NatsClientSender, CatchErrors, etc
└── templates/
```

---

## Key Concepts

### 1. HTTP + RPC Dual Pattern

The API Gateway handles **two types of requests**:

```typescript
// HTTP: Direct call (no NATS)
@Get('health')
@PublicRequest()
health() {
  return { status: 'ok' };
}

// HTTP → RPC: Delegate to microservice via NATS
@Get('users')
@ApiBearerAuth()
async findUsers(
  @RequestUserClaims() claims: TokenClaimsDto,
  @Query() filter: FilterUserDto
) {
  // Sends RPC call to user-micro
  return await this.userService.find(claims, filter);
}
```

### 2. Response Wrapping via Interceptor

All HTTP responses are wrapped in standard format:

```typescript
// ResponseWrapperInterceptor intercepts every response
// Input:  { id: 1, name: 'John' }
// Output:
{
  timestamp: '2025-11-30T10:00:00Z',
  path: '/users/1',
  method: 'GET',
  statusCode: 200,
  data: { id: 1, name: 'John' }
}

// For paginated responses:
{
  timestamp: '2025-11-30T10:00:00Z',
  path: '/users',
  method: 'GET',
  statusCode: 200,
  data: [{ id: 1, name: 'John' }, ...],
  pagination: {
    page: 1,
    size: 10,
    totalPages: 5
  }
}
```

### 3. JWT Authentication Flow

```
Client Request with Bearer Token
    ↓
JwtGuard.canActivate()
    ↓
Check @PublicRequest() decorator
    ↓
If not public → JwtStrategy.validate()
    ↓
Extract token from Authorization header
    ↓
Verify JWT signature
    ↓
Check if token is blacklisted in Redis
    ↓
Verify user still exists in user-micro
    ↓
Inject claims into request.user
```

### 4. Service Layer (RPC Delegation Pattern)

Each service module delegates to a microservice via NATS:

```typescript
// user/user.service.ts
@Injectable()
export class UserService {
  private readonly sender: NatsClientSender<typeof UserMessagePattern>;

  constructor(@Inject('NATS_SERVICE') private natsClient: ClientProxy) {
    // Helper to send RPC calls
    this.sender = new NatsClientSender(natsClient, UserMessagePattern);
  }

  @CatchErrors({ rpcMessage: 'User service unavailable' })
  async findById(claims: TokenClaimsDto) {
    // Sends RPC call: user.find.id
    return await this.sender.send({
      messagePattern: 'findById',
      payload: { claims }  // Wraps payload automatically
    });
  }

  @CatchErrors({ rpcMessage: 'User service unavailable' })
  async create(claims: TokenClaimsDto, createUserDto: CreateUserDto) {
    // Sends RPC call: user.create
    return await this.sender.send({
      messagePattern: 'create',
      payload: {
        claims,
        request: { body: createUserDto }
      }
    });
  }
}
```

### 5. Controller Pattern (HTTP Endpoints)

Controllers accept HTTP requests and delegate to services:

```typescript
// user/user.controller.ts
@ApiTags('User')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponseConstruction({ status: 200, model: User })
  async findById(@RequestUserClaims() claims: TokenClaimsDto) {
    // Calls service which sends RPC to user-micro
    return await this.userService.findById(claims);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create user' })
  async create(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() createUserDto: CreateUserDto
  ) {
    return await this.userService.create(claims, createUserDto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  async update(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto
  ) {
    return await this.userService.update(claims, id, updateUserDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  async delete(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string
  ) {
    return await this.userService.delete(claims, id);
  }
}
```

### 6. Error Handling

**Global Exception Filter** converts RPC errors to HTTP responses:

```typescript
// Catches RpcException thrown by microservices
@Catch(RpcException)
export class RpcExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const error = exception.getError();

    return response.status(error.statusCode || 500).json({
      timestamp: new Date().toISOString(),
      path: ctx.getRequest<Request>().path,
      status: 'error',
      statusCode: error.statusCode || 500,
      message: error.message || 'Unknown error',
      details: error.details || null
    });
  }
}
```

### 7. NATS Client Configuration

In `client/clients.ts`:

```typescript
export const NATSClient: ClientsProviderAsyncOptions = {
  name: 'NATS_SERVICE',
  useFactory: (configService: ConfigService) => ({
    transport: Transport.NATS,
    options: {
      servers: [configService.get('NATS_SERVER')],
      timeout: 30000,              // 30 second timeout per RPC call
      maxPayload: 50 * 1024 * 1024 // 50MB max payload
    }
  }),
  inject: [ConfigService]
};
```

### 8. Redis for Token Blacklist

When user logs out, token is added to Redis blacklist:

```typescript
// auth/auth.service.ts
async logout(claims: TokenClaimsDto) {
  // Calculate remaining time
  const expiresIn = claims.exp - Math.floor(Date.now() / 1000);

  // Add token ID to Redis blacklist
  await this.redisService.setex(
    `blacklist:${claims.jti}`,
    expiresIn,
    '1'
  );

  return { message: 'Logged out' };
}

// jwt.strategy.ts
async validate(req: Request, payload: TokenClaimsDto) {
  // Check if token is blacklisted
  const isBlacklisted = await this.redisService.get(`blacklist:${payload.jti}`);
  if (isBlacklisted) throw new BadRequestException('Invalid Token');

  return payload;
}
```

### 9. Swagger Documentation

Models with `@ApiProperty` decorators are used for Swagger docs:

```typescript
// models/user.model.ts
export class User {
  @ApiProperty({ description: 'User ID', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'First name' })
  firstName: string;

  @ApiProperty({ description: 'Email address', format: 'email' })
  email: string;

  @ApiProperty({ type: Role, description: 'User role' })
  role: Role;
}

// Then used in controller:
@ApiResponseConstruction({ status: 200, model: User })
async findById(@RequestUserClaims() claims: TokenClaimsDto) {
  // Swagger shows this endpoint returns User model
  return await this.userService.findById(claims);
}
```

---

## Environment Variables

Required in `.env`:

```
APP_PORT=3000
APP_NAME=api-gateway

NATS_SERVER=nats://localhost:4222

JWT_SECRET=your-secret-key
JWT_EXPIRATION=3600  # 1 hour in seconds

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

LOG_LEVEL=debug
```

---

## Common Operations

### Adding a New Module

1. Create folder: `modules/new-feature/`
2. Create files:
   - `new-feature.module.ts`
   - `new-feature.controller.ts`
   - `new-feature.service.ts`
   - `new-feature-message.pattern.ts`
   - `dtos/` folder
3. Create response model in `models/new-feature.model.ts`
4. Import module in `app.module.ts`

### Adding a New HTTP Endpoint

1. Define message pattern in microservice:
   ```typescript
   // In user-micro: user-message.pattern.ts
   export const UserMessagePattern = {
     getStats: 'user.stats.get'
   } as const;
   ```

2. Implement handler in microservice controller:
   ```typescript
   // In user-micro: user.controller.ts
   @MessagePattern(UserMessagePattern.getStats)
   async getStats(@Payload() payload: MessagePayloadDto) {
     return await this.userService.getStats(payload.claims.sub);
   }
   ```

3. Add RPC call in gateway service:
   ```typescript
   // In api-gateway: user.service.ts
   async getStats(claims: TokenClaimsDto) {
     return await this.sender.send({
       messagePattern: 'getStats',
       payload: { claims }
     });
   }
   ```

4. Add HTTP endpoint in gateway controller:
   ```typescript
   // In api-gateway: user.controller.ts
   @Get('stats')
   @ApiBearerAuth()
   async getStats(@RequestUserClaims() claims: TokenClaimsDto) {
     return await this.userService.getStats(claims);
   }
   ```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `app.module.ts` | Root module - imports all features |
| `main.ts` | Bootstrap - HTTP + NATS + Redis setup |
| `modules/user/user.controller.ts` | HTTP endpoint handlers |
| `modules/user/user.service.ts` | RPC delegation to user-micro |
| `common/guards/jwt.guard.ts` | Global JWT validation guard |
| `common/interceptors/response-wrapper.interceptor.ts` | Response formatting |
| `common/filters/rpc-exception.filter.ts` | RPC error to HTTP conversion |
| `database/redis.service.ts` | Redis token blacklist |
| `config/configuration.ts` | Joi env validation |

---

## Debugging Tips

1. **Check NATS connection**: Ensure `NATS_SERVER` env var is correct
2. **Check Redis connection**: Run `redis-cli ping` in terminal
3. **View Swagger docs**: Visit `http://localhost:3000/api-document`
4. **Test JWT**: Use Swagger to authorize with token
5. **Check request logs**: Look for RPC timeout messages
6. **Verify token blacklist**: Use `redis-cli` to check `KEYS blacklist:*`

---

## What to Remember When Building Media Service

1. **No database entities**: API Gateway has NO database models/entities
2. **RPC pattern**: All data fetches delegate to microservices via NATS
3. **Response wrapping**: All responses are intercepted and formatted
4. **Error handling**: RPC exceptions are caught and converted to HTTP
5. **Swagger docs**: Use `@ApiProperty` decorators on response models
6. **Token validation**: JWT guard checks token blacklist before proceeding
