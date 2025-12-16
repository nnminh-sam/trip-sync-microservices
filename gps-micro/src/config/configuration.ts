import * as Joi from 'joi';

export interface EnvSchema {
  APP_PORT: number;
  APP_NAME: string;
  NATS_SERVER: string;
  API_PREFIX: string;
  JWT_SECRET: string;
  MYSQL_HOST: string;
  MYSQL_PORT: number;
  MYSQL_ROOT_PASSWORD: string;
  MYSQL_DATABASE: string;
  MYSQL_USER: string;
  MYSQL_PASSWORD: string;
  FIREBASE_CERT_PATH: string;
  FIREBASE_DATABASE_URL: string;
}

export const validationSchema = Joi.object<EnvSchema>({
  APP_PORT: Joi.number().required(),
  APP_NAME: Joi.string().required(),
  NATS_SERVER: Joi.string().required(),
  API_PREFIX: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  MYSQL_HOST: Joi.string().required(),
  MYSQL_PORT: Joi.number().required(),
  MYSQL_ROOT_PASSWORD: Joi.string().required(),
  MYSQL_DATABASE: Joi.string().required(),
  MYSQL_USER: Joi.string().required(),
  MYSQL_PASSWORD: Joi.string().required(),
  FIREBASE_CERT_PATH: Joi.string().required(),
  FIREBASE_DATABASE_URL: Joi.string().required(),
});
