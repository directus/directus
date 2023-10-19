import { createError, ErrorCode } from '../index.js';

export interface InvalidProviderConfigErrorExtensions {
	provider: string;
	reason?: string;
}

export const InvalidProviderConfigError = createError<InvalidProviderConfigErrorExtensions>(
	ErrorCode.InvalidProviderConfig,
	'Invalid config.',
	503
);
