import { validationSchema, EnvSchema } from 'src/config/configuration';

type EnvKeys = keyof EnvSchema;

export { validationSchema, EnvSchema, EnvKeys };
