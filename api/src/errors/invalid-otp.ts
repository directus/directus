import { createError } from '@directus/errors';

export const InvalidOtpError = createError('INVALID_OTP', 'Invalid user OTP.', 401);