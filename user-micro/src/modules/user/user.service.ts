import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from 'src/modules/user/dtos/create-user.dto';
import { FilterUserDto } from 'src/modules/user/dtos/filter-user.dto';
import { UpdateUserDto } from 'src/modules/user/dtos/update-user.dto';
import { User } from 'src/models/user.model';
import { formatDate, throwRpcException } from 'src/utils';
import { RoleService } from 'src/modules/role/role.service';
import { ConfigService } from '@nestjs/config';
import { EnvSchema } from 'src/config';
import * as bcrypt from 'bcryptjs';
import { ListDataDto } from 'src/dtos/list-data.dto';
import { Gender } from 'src/models/enums/gender.enum';
import * as crypto from 'crypto';

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

    const createUserDto = {
      firstName: this.configService.get('SYSAD_FIRSTNAME'),
      lastName: this.configService.get('SYSAD_LASTNAME'),
      email: this.configService.get('SYSAD_EMAIL'),
      password: this.configService.get('SYSAD_PASSWORD'),
      role: 'system admin',
      citizenId: this.configService.get('SYSAD_CITIZEN_ID'),
      phoneNumber: this.configService.get('SYSAD_PHONE_NUMBER'),
      gender: Gender.OTHER,
      dateOfBirth: new Date('1990-01-01'),
      isActive: true,
      deletedAt: null,
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
      .select([
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.email',
        'user.roleId',
        'user.createdAt',
        'user.updatedAt',
        'user.password',
        'user.citizenId',
        'user.phoneNumber',
        'user.gender',
        'user.dateOfBirth',
        'user.isActive',
        'role.id',
        'role.name',
      ])
      .leftJoinAndSelect('user.role', 'role')
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
        'user.citizenId',
        'user.phoneNumber',
        'user.gender',
        'user.dateOfBirth',
        'user.isActive',
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

    const { page, size } = filter;
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
      'user.citizenId',
      'user.phoneNumber',
      'user.gender',
      'user.dateOfBirth',
      'user.isActive',
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

    if (filter.gender) {
      queryBuilder.andWhere('user.gender = :gender', {
        gender: filter.gender,
      });
    }

    if (filter.citizenId) {
      queryBuilder.andWhere('user.citizenId LIKE :citizenId', {
        citizenId: `%${filter.citizenId}%`,
      });
    }

    if (filter.phoneNumber) {
      queryBuilder.andWhere('user.phoneNumber LIKE :phoneNumber', {
        phoneNumber: `%${filter.phoneNumber}%`,
      });
    }

    if (filter.roleId) {
      queryBuilder.andWhere('user.roleId = :roleId', {
        roleId: filter.roleId,
      });
    }

    if (filter.dateOfBirth) {
      queryBuilder.andWhere('user.dateOfBirth = :dateOfBirth', {
        dateOfBirth: filter.dateOfBirth,
      });
    }

    if (filter.isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', {
        isActive: filter.isActive,
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
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      password: hashedPassword,
      roleId: role.id,
      role: role,
      citizenId: payload.citizenId,
      phoneNumber: payload.phoneNumber,
      gender: payload.gender,
      dateOfBirth: formatDate(payload.dateOfBirth.toString()),
      isActive: true,
      deletedAt: null,
    });
    const savedUser = await this.userRepository.save(user);

    const { password, ...userWithoutPassword } = savedUser;
    const userResponse = {
      ...userWithoutPassword,
      role: {
        id: role.id,
        name: role.name,
      },
    };

    this.logger.log(
      `User created successfully with ID: ${savedUser.id}, email: ${savedUser.email}`,
    );
    return userResponse;
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

    if (payload.firstName !== undefined) user.firstName = payload.firstName;
    if (payload.lastName !== undefined) user.lastName = payload.lastName;
    if (payload.citizenId !== undefined) user.citizenId = payload.citizenId;
    if (payload.phoneNumber !== undefined)
      user.phoneNumber = payload.phoneNumber;
    if (payload.gender !== undefined) user.gender = payload.gender;
    if (payload.dateOfBirth !== undefined)
      user.dateOfBirth = payload.dateOfBirth;

    const updatedUser = await this.userRepository.save(user);

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;

    this.logger.log(
      `User updated successfully with ID: ${updatedUser.id}, email: ${updatedUser.email}`,
    );
    return userWithoutPassword;
  }

  async delete(id: string) {
    this.logger.log(`Soft deleting user with ID: ${id}`);

    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      this.logger.warn(`User deletion failed - user not found with ID: ${id}`);
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'User Not Found',
      });
    }

    if (user.deletedAt) {
      this.logger.warn(
        `User deletion failed - user already deleted with ID: ${id}`,
      );
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'User already deleted',
      });
    }

    user.deletedAt = new Date();
    user.isActive = false;

    const deletedUser = await this.userRepository.save(user);

    // Remove password from response
    const { password, ...userWithoutPassword } = deletedUser;

    this.logger.log(
      `User soft deleted successfully with ID: ${deletedUser.id}, email: ${deletedUser.email}`,
    );
    return userWithoutPassword;
  }

  async activate(id: string) {
    this.logger.log(`Activating user with ID: ${id}`);

    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      this.logger.warn(
        `User activation failed - user not found with ID: ${id}`,
      );
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'User Not Found',
      });
    }

    if (user.isActive) {
      this.logger.warn(
        `User activation failed - user already active with ID: ${id}`,
      );
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'User already active',
      });
    }

    user.isActive = true;
    user.deletedAt = null;

    const updatedUser = await this.userRepository.save(user);

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;

    this.logger.log(
      `User activated successfully with ID: ${updatedUser.id}, email: ${updatedUser.email}`,
    );
    return userWithoutPassword;
  }

  async deactivate(id: string) {
    this.logger.log(`Deactivating user with ID: ${id}`);

    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      this.logger.warn(
        `User deactivation failed - user not found with ID: ${id}`,
      );
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'User Not Found',
      });
    }

    if (!user.isActive) {
      this.logger.warn(
        `User deactivation failed - user already inactive with ID: ${id}`,
      );
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'User already inactive',
      });
    }

    user.isActive = false;

    const updatedUser = await this.userRepository.save(user);

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;

    this.logger.log(
      `User deactivated successfully with ID: ${updatedUser.id}, email: ${updatedUser.email}`,
    );
    return userWithoutPassword;
  }

  async updatePassword(userId: string) {
    this.logger.log(`Updating password for user with ID: ${userId}`);

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      this.logger.error(`User not found with ID: ${userId}`);
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'User Not Found',
      });
    }

    const newPassword = this.generateRandomPassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    const updatedUser = await this.userRepository.save(user);
    this.logger.log(`Password updated successfully for user ID: ${userId}`);

    // Send password reset email
    // try {
    //   this.emailService.sendPasswordResetEmail({
    //     email: user.email,
    //     firstName: user.firstName,
    //     lastName: user.lastName,
    //     newPassword: newPassword,
    //   });
    //   this.logger.log(`Password reset email sent to user: ${user.email}`);
    // } catch (error) {
    //   this.logger.error(
    //     `Failed to send password reset email to user: ${user.email}`,
    //     error.stack,
    //   );
    //   // Continue even if email fails - password is already reset
    // }

    const userWithoutPassword = { ...updatedUser };
    delete userWithoutPassword.password;
    return userWithoutPassword as User;
  }

  async updatePublicKey(userId: string, publicKey: string) {
    this.logger.log(`Updating public key for user with ID: ${userId}`);

    if (!publicKey || publicKey.trim().length === 0) {
      this.logger.warn(
        `Public key update failed - empty public key for user ID: ${userId}`,
      );
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Public key cannot be empty',
      });
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(
        `Public key update failed - user not found with ID: ${userId}`,
      );
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'User Not Found',
      });
    }

    user.publicKey = publicKey;
    const updatedUser = await this.userRepository.save(user);

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;

    this.logger.log(
      `Public key updated successfully for user ID: ${updatedUser.id}`,
    );
    return userWithoutPassword;
  }

  async getPublicKeyById(userId: string) {
    this.logger.log(`Retrieving public key for user with ID: ${userId}`);

    const user = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.email', 'user.publicKey'])
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user) {
      this.logger.warn(
        `Public key retrieval failed - user not found with ID: ${userId}`,
      );
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'User Not Found',
      });
    }

    if (!user.publicKey) {
      this.logger.warn(`Public key not set for user ID: ${userId}`);
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Public Key Not Set',
      });
    }

    this.logger.log(`Public key retrieved for user ID: ${userId}`);
    return {
      id: user.id,
      email: user.email,
      publicKey: user.publicKey,
    };
  }

  private generateRandomPassword(length: number = 12): string {
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    const randomBytes = crypto.randomBytes(length);
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset[randomBytes[i] % charset.length];
    }
    return password;
  }
}
