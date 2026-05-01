import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export const InvalidPasswordError: DirectusErrorConstructor<void> = createError(
	ErrorCode.InvalidPassword,
	`Provided password doesn't match the password policy.`,
	400,
);
