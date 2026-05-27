import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export const TokenExpiredError: DirectusErrorConstructor<void> = createError(
	ErrorCode.TokenExpired,
	'Token expired.',
	401,
);
