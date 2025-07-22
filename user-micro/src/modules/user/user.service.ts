import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from 'src/modules/user/dtos/create-user.dto';
import { FilterUserDto } from 'src/modules/user/dtos/filter-user.dto';
import { UpdateUserDto } from 'src/modules/user/dtos/update-user.dto';
import { User } from 'src/models/user.model';
import { throwRpcException } from 'src/utils';
import { RoleService } from 'src/modules/role/role.service';
import { ConfigService } from '@nestjs/config';
import { EnvSchema } from 'src/config';
import * as bcrypt from 'bcryptjs';
import { ListDataDto } from 'src/dtos/list-data.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly configService: ConfigService<EnvSchema>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly roleService: RoleService,
  ) {}

  async onStartUp() {
    this.logger.log('Seeding default system admin user if not exist...');

    const createUserDto: CreateUserDto = {
      firstName: this.configService.get('SYSAD_FIRSTNAME'),
      lastName: this.configService.get('SYSAD_LASTNAME'),
      email: this.configService.get('SYSAD_EMAIL'),
      password: this.configService.get('SYSAD_PASSWORD'),
      role: 'system admin',
    };
    const existingUser = await this.userRepository.exists({
      where: { email: createUserDto.email },
    });
    if (!existingUser) {
      await this.create(createUserDto);
      this.logger.log('System admin user created');
    }
    this.logger.log('User seeding completed.');
  }

  async findByEmail(email: string) {
    this.logger.log(`Finding user by email: ${email}`);

    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .select([
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.email',
        'user.roleId',
        'user.createdAt',
        'user.updatedAt',
        'user.password',
        'role.id',
        'role.name',
      ])
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      this.logger.warn(`User not found with email: ${email}`);
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'User Not Found',
      });
    }

    this.logger.log(`User found with email: ${email}, ID: ${user.id}`);
    return user;
  }

  async findById(id: string) {
    this.logger.log(`Finding user by ID: ${id}`);

    const user = await this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.email',
        'user.roleId',
        'user.createdAt',
        'user.updatedAt',
      ])
      .where('user.id = :id', { id })
      .getOne();

    if (!user) {
      this.logger.warn(`User not found with ID: ${id}`);
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'User Not Found',
      });
    }

    this.logger.log(`User found with ID: ${id}, email: ${user.email}`);
    return user;
  }

  async find(filter: FilterUserDto) {
    this.logger.log(`Finding users with filter: ${JSON.stringify(filter)}`);

    const { page, size, order, sortBy, ...rest } = filter;
    const skip: number = (page - 1) * size;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    queryBuilder.select([
      'user.id',
      'user.firstName',
      'user.lastName',
      'user.email',
      'user.roleId',
      'user.createdAt',
      'user.updatedAt',
    ]);

    if (filter.email) {
      queryBuilder.andWhere('user.email LIKE :email', {
        email: `%${filter.email}%`,
      });
    }

    if (filter.firstName) {
      queryBuilder.andWhere('user.firstName LIKE :firstName', {
        firstName: `%${filter.firstName}%`,
      });
    }

    if (filter.lastName) {
      queryBuilder.andWhere('user.lastName LIKE :lastName', {
        lastName: `%${filter.lastName}%`,
      });
    }

    queryBuilder.skip(skip).take(size);

    const [users, total] = await queryBuilder.getManyAndCount();
    this.logger.log(
      `Found ${users.length} users (page ${page}, size ${size}, total ${total}) matching the filter criteria`,
    );

    return ListDataDto.build<User>({
      data: users,
      page,
      size,
      total,
    });
  }

  async create(payload: CreateUserDto) {
    this.logger.log(`Creating new user with email: ${payload.email}`);

    const existingUser = await this.userRepository.findOne({
      where: { email: payload.email },
    });

    if (existingUser) {
      this.logger.warn(
        `User creation failed - email already exists: ${payload.email}`,
      );
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'User with this email already exists',
      });
    }

    // Check if the role exists
    const role = await this.roleService.findByName(payload.role);
    if (!role) {
      this.logger.warn(
        `User creation failed - role does not exist: ${payload.role}`,
      );
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Role does not exist',
      });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(payload.password, 10);

    const user = this.userRepository.create({
      ...payload,
      password: hashedPassword,
      roleId: role.id,
      role: role,
    });
    const savedUser = await this.userRepository.save(user);

    this.logger.log(
      `User created successfully with ID: ${savedUser.id}, email: ${savedUser.email}`,
    );
    return savedUser;
  }

  async update(id: string, payload: UpdateUserDto) {
    this.logger.log(
      `Updating user with ID: ${id}, payload: ${JSON.stringify(payload)}`,
    );

    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      this.logger.warn(`User update failed - user not found with ID: ${id}`);
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'User Not Found',
      });
    }

    Object.assign(user, payload);
    const updatedUser = await this.userRepository.save(user);

    this.logger.log(
      `User updated successfully with ID: ${updatedUser.id}, email: ${updatedUser.email}`,
    );
    return updatedUser;
  }
}
