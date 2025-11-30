import * as Joi from 'joi';

export interface EnvSchema {
  // Application
  APP_PORT: number;
  APP_NAME: string;
  NODE_ENV: string;

  // NATS
  NATS_SERVER: string;

  // MySQL
  MYSQL_HOST: string;
  MYSQL_PORT: number;
  MYSQL_USER: string;
  MYSQL_PASSWORD: string;
  MYSQL_DATABASE: string;

  // Logging
  LOG_LEVEL: string;
}

export const validationSchema = Joi.object<EnvSchema>({
  APP_PORT: Joi.number().default(3002),
  APP_NAME: Joi.string().default('media-service'),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'staging')
    .default('development'),

  NATS_SERVER: Joi.string().required(),

  MYSQL_HOST: Joi.string().required(),
  MYSQL_PORT: Joi.number().required(),
  MYSQL_USER: Joi.string().required(),
  MYSQL_PASSWORD: Joi.string().required(),
  MYSQL_DATABASE: Joi.string().required(),

  LOG_LEVEL: Joi.string()
    .valid('debug', 'info', 'warn', 'error')
    .default('info'),
}).unknown(true);

export const configuration = () => ({
  app: {
    port: process.env.APP_PORT || 3002,
    name: process.env.APP_NAME || 'media-service',
    env: process.env.NODE_ENV || 'development',
  },
  nats: {
    server: process.env.NATS_SERVER,
  },
  database: {
    type: 'mysql',
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
});
