import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export const InvalidCredentialswError: DirectusErrorConstructor<void> = createError(
	ErrorCode.InvalidCredentials,
	'Invalid user credentials.',
	401,
);
