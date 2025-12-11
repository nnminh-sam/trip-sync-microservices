import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { LoginDto } from 'src/modules/auth/dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { throwRpcException } from 'src/utils';
import { UserService } from 'src/modules/user/user.service';
import * as bcrypt from 'bcryptjs';
import { AuthorizeClaimsPayloadDto } from 'src/modules/role/dtos/authorize-claims-payload.dto';
import { RoleService } from 'src/modules/role/role.service';
import { User } from 'src/models/user.model';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { EnvSchema } from 'src/config';

@Injectable()
export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);
  private readonly firebaseAdmin;

  // TODO: setup firebase and create an admin credential for user service
  constructor(
    private readonly configService: ConfigService<EnvSchema>,

    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly roleService: RoleService,
  ) {
    this.logger.log('Setting up firebase admin');
    const firebaseCertPath = this.configService.get('FIREBASE_CERT_PATH');
    this.firebaseAdmin = admin;
    this.firebaseAdmin.initializeApp({
      credential: admin.credential.cert(firebaseCertPath),
    });
  }

  async generateFirebaseToken(userId: string) {
    const customToken: string = await this.firebaseAdmin
      .auth()
      .createCustomToken(userId);
    this.logger.log(`Generated custom token: ${customToken.substring(0, 12)}`);
    return customToken;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    this.logger.log(`Login attempt for email: ${email}`);

    try {
      const user = await this.userService.findByEmail(email);
      if (!user) {
        this.logger.error('Login Failed! User Not Found');
        throwRpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'User Not Found',
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        this.logger.error('Login Failed! Password Does Not Match');
        throwRpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid Credentials',
        });
      }

      this.logger.log('Login successful. Returning user info.');
      const firebaseToken = await this.generateFirebaseToken(user.email);
      const userWithoutPassword: any = { ...user };
      delete userWithoutPassword.password;
      userWithoutPassword.firebaseToken = firebaseToken;
      return userWithoutPassword as User;
    } catch (error) {
      this.logger.error('Login failed:', error);
      throwRpcException({
        status: 'error',
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message,
      });
    }
  }

  async updatePassword(userId: string) {
    return await this.userService.updatePassword(userId);
  }

  async authorizeClaims(payload: AuthorizeClaimsPayloadDto) {
    try {
      await this.roleService.authorizeClaims(payload);
    } catch (error) {
      throwRpcException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized Claims',
      });
    }
  }
}
