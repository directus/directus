import { createError } from '@directus/errors';

export interface InvalidConfigErrorExtensions {
	provider: string;
}

export const InvalidConfigError = createError<InvalidConfigErrorExtensions>('INVALID_CONFIG', 'Invalid config.', 503);
