import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export const InvalidTokenError: DirectusErrorConstructor<void> = createError(
	ErrorCode.InvalidToken,
	'Invalid token.',
	403,
);
