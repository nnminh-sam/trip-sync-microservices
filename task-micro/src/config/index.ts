import { EnvSchema, validationSchema } from './configuration';

type EnvKeys = keyof EnvSchema;

export { validationSchema, EnvSchema, EnvKeys };
