import * as Joi from 'joi';

export interface EnvSchema {
  // Application
  APP_PORT: number;
  APP_NAME: string;
  NODE_ENV: string;

  // Authentication
  API_GATEWAY_BASE_URL: string;

  // MySQL
  MYSQL_HOST: string;
  MYSQL_PORT: number;
  MYSQL_USER: string;
  MYSQL_PASSWORD: string;
  MYSQL_DATABASE: string;

  // Google Cloud Storage
  GCS_PROJECT_ID: string;
  GCS_BUCKET_NAME: string;
  GCS_KEY_FILENAME?: string;
  GCS_CLIENT_EMAIL?: string;
  GCS_PRIVATE_KEY?: string;

  // Logging
  LOG_LEVEL: string;
}

export const validationSchema = Joi.object<EnvSchema>({
  APP_PORT: Joi.number().default(3002),
  APP_NAME: Joi.string().default('media-service'),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'staging')
    .default('development'),

  API_GATEWAY_BASE_URL: Joi.string().required(),

  MYSQL_HOST: Joi.string().required(),
  MYSQL_PORT: Joi.number().required(),
  MYSQL_USER: Joi.string().required(),
  MYSQL_PASSWORD: Joi.string().required(),
  MYSQL_DATABASE: Joi.string().required(),

  GCS_PROJECT_ID: Joi.string().optional(),
  GCS_BUCKET_NAME: Joi.string().optional(),
  GCS_KEY_FILENAME: Joi.string().optional(),
  GCS_CLIENT_EMAIL: Joi.string().optional(),
  GCS_PRIVATE_KEY: Joi.string().optional(),

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
  auth: {
    apiGatewayUrl: process.env.API_GATEWAY_BASE_URL,
  },
  database: {
    type: 'mysql',
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  },
  gcs: {
    projectId: process.env.GCS_PROJECT_ID,
    bucketName: process.env.GCS_BUCKET_NAME,
    keyFilename: process.env.GCS_KEY_FILENAME,
    clientEmail: process.env.GCS_CLIENT_EMAIL,
    privateKey: process.env.GCS_PRIVATE_KEY,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
});
