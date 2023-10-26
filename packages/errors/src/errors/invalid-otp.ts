import { createError, ErrorCode } from '../index.js';

export const InvalidOtpError = createError(ErrorCode.InvalidOtp, 'Invalid user OTP.', 401);
