import { createError } from '@directus/errors';
import { ErrorCode } from './codes.js';

export const TokenExpiredError = createError(ErrorCode.TokenExpired, 'Token expired.', 401);
