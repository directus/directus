import { createError, ErrorCode } from '../index.js';

export const InviteInvalidError = createError(
	ErrorCode.InviteInvalid,
	'This invitation is no longer valid.',
	400,
);