import { createError } from '@directus/errors';
import { ErrorCode } from './codes.js';

export const InvalidTokenError = createError(ErrorCode.InvalidToken, 'Invalid token.', 403);
