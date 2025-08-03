import * as Joi from 'joi';

export interface EnvSchema {
  APP_PORT: number;
  APP_NAME: string;
  NATS_SERVER: string;
  API_PREFIX: string;
  JWT_SECRET: string;
  MYSQL_HOST: string;
  MYSQL_ROOT_PASSWORD: string;
  MYSQL_DATABASE: string;
  MYSQL_USER: string;
  MYSQL_PASSWORD: string;
  SYSAD_FIRSTNAME: string;
  SYSAD_LASTNAME: string;
  SYSAD_EMAIL: string;
  SYSAD_PASSWORD: string;
  SYSAD_CITIZEN_ID: string;
  SYSAD_PHONE_NUMBER: string;
  MAIL_HOST: string;
  MAIL_PORT: number;
  MAIL_SECURE: boolean;
  MAIL_USER: string;
  MAIL_PASSWORD: string;
  MAIL_FROM: string;
}

export const validationSchema = Joi.object<EnvSchema>({
  APP_PORT: Joi.number().required(),
  APP_NAME: Joi.string().required(),
  NATS_SERVER: Joi.string().required(),
  API_PREFIX: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  MYSQL_HOST: Joi.string().required(),
  MYSQL_ROOT_PASSWORD: Joi.string().required(),
  MYSQL_DATABASE: Joi.string().required(),
  MYSQL_USER: Joi.string().required(),
  MYSQL_PASSWORD: Joi.string().required(),
  SYSAD_FIRSTNAME: Joi.string().required(),
  SYSAD_LASTNAME: Joi.string().required(),
  SYSAD_EMAIL: Joi.string().required(),
  SYSAD_PASSWORD: Joi.string().required(),
  SYSAD_CITIZEN_ID: Joi.string().required(),
  SYSAD_PHONE_NUMBER: Joi.string().required(),
  MAIL_HOST: Joi.string().required(),
  MAIL_PORT: Joi.number().required(),
  MAIL_SECURE: Joi.boolean().required(),
  MAIL_USER: Joi.string().required(),
  MAIL_PASSWORD: Joi.string().required(),
  MAIL_FROM: Joi.string().email().required(),
});
