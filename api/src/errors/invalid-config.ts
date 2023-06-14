import { createError } from '@directus/errors';
import { ErrorCode } from './codes.js';

export interface InvalidConfigErrorExtensions {
	provider: string;
	reason?: string;
}

export const InvalidConfigError = createError<InvalidConfigErrorExtensions>(
	ErrorCode.InvalidConfig,
	'Invalid config.',
	503
);
