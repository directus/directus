import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export interface InvalidProviderConfigErrorExtensions {
	provider: string;
	reason?: string;
}

export const InvalidProviderConfigError: DirectusErrorConstructor<InvalidProviderConfigErrorExtensions> =
	createError<InvalidProviderConfigErrorExtensions>(ErrorCode.InvalidProviderConfig, 'Invalid config.', 503);
