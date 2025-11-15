import { validationSchema, EnvSchema } from 'src/config/configuration';
import gcsConfig from './gcs.config';

type EnvKeys = keyof EnvSchema;

export { validationSchema, EnvSchema, EnvKeys, gcsConfig };
