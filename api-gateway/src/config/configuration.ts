import * as Joi from 'joi';

export interface EnvSchema {
  APP_PORT: number;
  APP_NAME: string;
  NATS_SERVER: string;
  API_PREFIX: string;
  JWT_SECRET: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  REDIS_DB: number;
}

export const validationSchema = Joi.object<EnvSchema>({
  APP_PORT: Joi.number().required(),
  APP_NAME: Joi.string().required(),
  NATS_SERVER: Joi.string().required(),
  API_PREFIX: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().required(),
  REDIS_PASSWORD: Joi.string().optional(),
  REDIS_DB: Joi.number().required(),
});
