import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export const InvalidCredentialsError: DirectusErrorConstructor<void> = createError(
	ErrorCode.InvalidCredentials,
	'Invalid user credentials.',
	401,
);
