import { createError, ErrorCode } from '../index.js';

export const TokenExpiredError = createError(ErrorCode.TokenExpired, 'Token expired.', 401);
