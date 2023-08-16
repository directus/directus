import { createError } from '@directus/errors';
import { ErrorCode } from './codes.js';

export const InvalidOtpError = createError(ErrorCode.InvalidOtp, 'Invalid user OTP.', 401);
