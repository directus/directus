import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export const InvalidOtpError: DirectusErrorConstructor<void> = createError(
	ErrorCode.InvalidOtp,
	'Invalid user OTP.',
	401,
);
