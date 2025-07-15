import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { EnvSchema } from 'src/config';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly redis: Redis;
  private readonly BLACKLIST_PREFIX = 'blacklist:';
  private readonly TOKEN_PREFIX = 'token:';

  constructor(private readonly configService: ConfigService<EnvSchema>) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB'),
      maxRetriesPerRequest: 3,
    });

    this.redis.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis Connection Error:', error);
    });
  }

  async onModuleDestroy() {
    try {
      await this.redis.quit();
    } catch (error) {
      this.logger.error('Error quitting Redis:', error);
    }
  }

  async addToBlacklist(
    token: string,
    expiresInSeconds: number,
  ): Promise<boolean> {
    const key = `${this.BLACKLIST_PREFIX}${token}`;
    try {
      await this.redis.setex(key, expiresInSeconds, '1');
      this.logger.debug(
        `Token added to blacklist: ${token.substring(0, 20)}...`,
      );
      return true;
    } catch (error) {
      this.logger.error('Error adding token to blacklist:', error);
      return false;
    }
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const key = `${this.BLACKLIST_PREFIX}${token}`;
    try {
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      this.logger.error('Error checking if token is blacklisted:', error);
      return false;
    }
  }

  async removeFromBlacklist(token: string): Promise<boolean> {
    const key = `${this.BLACKLIST_PREFIX}${token}`;
    try {
      await this.redis.del(key);
      this.logger.debug(
        `Token removed from blacklist: ${token.substring(0, 20)}...`,
      );
      return true;
    } catch (error) {
      this.logger.error('Error removing token from blacklist:', error);
      return false;
    }
  }

  async storeUserToken(
    userId: string,
    token: string,
    expiresInSeconds: number,
  ): Promise<boolean> {
    const key = `${this.TOKEN_PREFIX}${userId}`;
    try {
      await this.redis.setex(key, expiresInSeconds, token);
      return true;
    } catch (error) {
      this.logger.error('Error storing user token:', error);
      return false;
    }
  }

  async getUserToken(userId: string): Promise<string | null> {
    const key = `${this.TOKEN_PREFIX}${userId}`;
    try {
      return await this.redis.get(key);
    } catch (error) {
      this.logger.error('Error getting user token:', error);
      return null;
    }
  }

  async revokeUserTokens(userId: string): Promise<boolean> {
    const key = `${this.TOKEN_PREFIX}${userId}`;
    try {
      const token = await this.redis.get(key);
      if (token) {
        // Add the token to blacklist before removing it
        await this.addToBlacklist(token, 3600); // Blacklist for 1 hour
        await this.redis.del(key);
        this.logger.debug(`All tokens revoked for user: ${userId}`);
      }
      return true;
    } catch (error) {
      this.logger.error('Error revoking user tokens:', error);
      return false;
    }
  }

  getClient(): Redis {
    return this.redis;
  }
}
