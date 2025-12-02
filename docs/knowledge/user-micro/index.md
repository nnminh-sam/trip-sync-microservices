# User Microservice Documentation

## Overview

The User Service is a **NestJS microservice** that manages user data, authentication, roles, and permissions. It runs on both HTTP and NATS protocols.

- **Location**: `user-micro/src`
- **Database**: MySQL via TypeORM
- **Communication**: HTTP (REST) + NATS (RPC)
- **Port**: Configurable via `APP_PORT` env var

---

## Architecture

### Boot Process (`user-micro/src/main.ts`)

```typescript
const app = await NestFactory.create(AppModule);

// Connect NATS microservice transport
app.connectMicroservice({
  transport: Transport.NATS,
  options: { servers: [process.env.NATS_SERVER] }
});

// Start both HTTP and NATS listeners
await app.startAllMicroservices();
await app.listen(port);
```

The service listens on:
- **HTTP**: Localhost on configured port (for health checks, direct calls)
- **NATS**: NATS server for RPC calls from API Gateway

---

## Directory Structure

```
user-micro/src/
├── main.ts                      # Entry point (HTTP + NATS bootstrap)
├── app.module.ts                # Root module with all imports
├── app.controller.ts            # Root controller
├── config/                      # Environment & validation config
│   ├── configuration.ts         # Joi validation schema
│   └── index.ts
├── client/                      # NATS client configuration
│   ├── client.module.ts
│   └── clients.ts
├── database/                    # TypeORM MySQL configuration
│   └── database.module.ts
├── models/                      # TypeORM Entities (database models)
│   ├── base.model.ts           # Base entity with UUID, timestamps, soft delete
│   ├── user.model.ts
│   ├── role.model.ts
│   ├── permission.model.ts
│   ├── role-permission.model.ts
│   ├── enums/
│   │   └── gender.enum.ts
│   └── index.ts                # Barrel exports
├── common/                      # Shared utilities
│   ├── decorators/
│   │   └── require-permission.decorator.ts
│   ├── guards/
│   │   ├── permission.guard.ts
│   │   └── local-auth.guard.ts
│   └── filters/
├── dtos/                        # Data Transfer Objects (shared across modules)
│   ├── message-payload.dto.ts  # Envelope for NATS RPC payloads
│   ├── token-claims.dto.ts      # JWT claims structure
│   ├── base-request-filter.dto.ts
│   ├── rpc-response.dto.ts
│   └── list-data.dto.ts
├── modules/                     # Feature modules
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth-message.pattern.ts
│   │   └── dtos/
│   ├── user/
│   │   ├── user.module.ts
│   │   ├── user.controller.ts   # @MessagePattern RPC handlers
│   │   ├── user.service.ts      # Business logic
│   │   ├── user.repository.ts   # Custom database queries (optional)
│   │   ├── user-message.pattern.ts
│   │   └── dtos/
│   ├── role/
│   ├── permission/
│   └── audit-log/
├── utils/                       # Helper functions
│   └── index.ts
└── templates/                   # Email templates
    └── email/
```

---

## Key Concepts

### 1. Base Model

All entities extend `BaseModel`:

```typescript
// models/base.model.ts
@Entity()
export class BaseModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn({ nullable: true, default: null })
  deletedAt?: Date;  // Soft delete support
}
```

**Inheritance benefits**:
- Unique UUID primary key for all entities
- Automatic timestamp management
- Soft delete support (records marked but not removed)

### 2. Entity Relationships

**User Entity Example**:

```typescript
@Entity('users')
export class User extends BaseModel {
  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  // Foreign key to Role
  @Column({ type: 'uuid' })
  roleId: string;

  // Eager load role on user fetch
  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  @JoinColumn({ name: 'roleId' })
  role: Role;
}
```

### 3. Message Patterns (RPC)

RPC handlers are defined using `@MessagePattern` decorator:

```typescript
// user/user-message.pattern.ts
export const UserMessagePattern = {
  findById: 'user.find.id',
  findByToken: 'user.find.token',
  findAll: 'user.find',
  create: 'user.create',
  update: 'user.update',
  delete: 'user.delete',
} as const;

// user/user.controller.ts
@MessagePattern(UserMessagePattern.findById)
async findById(@Payload() payload: MessagePayloadDto) {
  // Extract JWT claims from payload
  const { claims } = payload;
  // Call service and return result
  return await this.userService.findById(claims.sub);
}
```

### 4. Message Payload Structure

All RPC calls use a standard envelope:

```typescript
// dtos/message-payload.dto.ts
export class MessagePayloadDto<T = null> {
  // JWT claims extracted by API Gateway
  claims?: TokenClaimsDto;

  // Request body, params, query
  request?: {
    body?: T;                  // POST/PATCH body
    path?: Record<string, any>;  // URL path variables
    param?: Record<string, any>; // Query parameters
  };
}

// Example usage in handler:
@MessagePattern(UserMessagePattern.create)
async create(@Payload() payload: MessagePayloadDto<CreateUserDto>) {
  const { claims, request } = payload;
  return await this.userService.create(
    claims,                    // User making request
    request.body              // DTO with user data
  );
}
```

### 5. Module Pattern

Each feature has a module that:
- Imports TypeORM entities
- Provides service and controller
- Optionally exports service for other modules

```typescript
// user/user.module.ts
@Module({
  imports: [
    AuditLogModule,           // Depends on audit log
    RoleModule,               // Depends on role
    TypeOrmModule.forFeature([User])  // Register User entity
  ],
  providers: [UserService, PermissionGuard],
  controllers: [UserController],
  exports: [UserService]      // Allow other modules to use
})
export class UserModule {}
```

### 6. Service Layer Pattern

Services handle business logic:

```typescript
// user/user.service.ts
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly roleService: RoleService
  ) {}

  async findById(id: string): Promise<User> {
    // TypeORM repository query
    return await this.userRepository.findOne({
      where: { id },
      relations: ['role']  // Include role data
    });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Validate
    const role = await this.roleService.findById(createUserDto.roleId);
    if (!role) throw new NotFoundException('Role not found');

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create and save
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword
    });
    return await this.userRepository.save(user);
  }
}
```

### 7. Database Configuration

TypeORM MySQL setup in `database/database.module.ts`:

```typescript
TypeOrmModule.forRootAsync({
  type: 'mysql',
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  entities: [User, Role, Permission, RolePermission, AuditLog],
  synchronize: true,  // Auto-create/update schema
  logging: true       // Log SQL queries
})
```

**Important**: Tables are auto-created from entities. No migrations needed.

### 8. NATS Client Configuration

In `client/clients.ts`:

```typescript
export const NATSClient: ClientsProviderAsyncOptions = {
  name: 'NATS_SERVICE',
  useFactory: (configService: ConfigService) => ({
    transport: Transport.NATS,
    options: {
      servers: [configService.get('NATS_SERVER')]
    }
  }),
  inject: [ConfigService]
};
```

---

## Environment Variables

Required in `.env`:

```
APP_PORT=3001
APP_NAME=user-service

NATS_SERVER=nats://localhost:4222

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=user_service_db

JWT_SECRET=your-secret-key

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
3. Create entity in `models/new-feature.model.ts`
4. Register entity in TypeOrmModule
5. Import module in `app.module.ts`

### Adding a New RPC Endpoint

1. Define message pattern:
   ```typescript
   // new-feature-message.pattern.ts
   export const NewFeatureMessagePattern = {
     getStats: 'newfeature.stats.get'
   } as const;
   ```

2. Implement handler:
   ```typescript
   // new-feature.controller.ts
   @MessagePattern(NewFeatureMessagePattern.getStats)
   async getStats(@Payload() payload: MessagePayloadDto) {
     return await this.service.getStats(payload.claims.sub);
   }
   ```

3. Call from API Gateway via NATS

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `app.module.ts` | Root module - imports all features |
| `main.ts` | Bootstrap - HTTP + NATS setup |
| `models/user.model.ts` | User entity definition |
| `modules/user/user.controller.ts` | RPC message handlers |
| `modules/user/user.service.ts` | Business logic |
| `dtos/message-payload.dto.ts` | RPC envelope structure |
| `config/configuration.ts` | Joi env validation |
| `database/database.module.ts` | TypeORM config |

---

## Debugging Tips

1. **Check NATS connection**: Ensure `NATS_SERVER` env var is correct
2. **Check database**: Run `SHOW TABLES IN user_service_db;` in MySQL
3. **View logs**: Check console output for `[NestFactory]` messages
4. **Test RPC call**: Use API Gateway to make calls via NATS
5. **Verify entity**: Ensure entity is registered in `TypeOrmModule.forFeature()`

---

## What to Follow When Building Media Service

1. **Module structure**: Mirror `user-micro` folder layout
2. **Entity inheritance**: Extend `BaseModel` for auto UUID + timestamps
3. **Message patterns**: Create `<feature>-message.pattern.ts` file
4. **RPC handlers**: Use `@MessagePattern` decorator in controller
5. **Service pattern**: Inject repository via `@InjectRepository()`
6. **Configuration**: Add env vars to schema in `config/configuration.ts`
7. **Database**: Let TypeORM auto-sync tables (no migrations)
