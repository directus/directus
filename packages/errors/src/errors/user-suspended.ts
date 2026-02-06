import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export const UserSuspendedError: DirectusErrorConstructor<void> = createError(
	ErrorCode.UserSuspended,
	'User suspended.',
	401,
);
