import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export const InvalidPasswordError: DirectusErrorConstructor = createError(
	ErrorCode.InvalidPassword,
	() => `Provided password does not meet the password policy requirements.`,
	400,
);
