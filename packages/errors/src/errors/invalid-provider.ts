import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export const InvalidProviderError: DirectusErrorConstructor<void> = createError(
	ErrorCode.InvalidProvider,
	'Invalid provider.',
	403,
);
