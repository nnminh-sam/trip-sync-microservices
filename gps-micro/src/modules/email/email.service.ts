import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { EnvSchema } from 'src/config';

export interface SendPasswordResetEmailDto {
  email: string;
  firstName: string;
  lastName: string;
  newPassword: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService<EnvSchema>,
  ) {}

  async sendPasswordResetEmail(data: SendPasswordResetEmailDto): Promise<void> {
    const { email, firstName, lastName, newPassword } = data;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Your Trip Sync Password Has Been Reset',
        template: 'password-reset',
        context: {
          firstName,
          lastName,
          newPassword,
          appName: 'Trip Sync',
          supportEmail: this.configService.get('MAIL_FROM'),
        },
      });

      this.logger.log(`Password reset email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}`,
        error.stack,
      );
      throw error;
    }
  }

  async sendWelcomeEmail(data: { email: string; firstName: string; lastName: string }): Promise<void> {
    const { email, firstName, lastName } = data;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Welcome to Trip Sync!',
        template: 'welcome',
        context: {
          firstName,
          lastName,
          appName: 'Trip Sync',
          supportEmail: this.configService.get('MAIL_FROM'),
        },
      });

      this.logger.log(`Welcome email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email to ${email}`,
        error.stack,
      );
      throw error;
    }
  }
}