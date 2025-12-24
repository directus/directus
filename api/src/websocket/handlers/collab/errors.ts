import { createError } from '@directus/errors';

export const RedisStoreError = createError<string>('REDIS_STORE', (message) => message);
