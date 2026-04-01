import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export const InvalidInviteError: DirectusErrorConstructor = createError(
	ErrorCode.InvalidInvite,
	() => `This invite is no longer valid.`,
	400,
);
