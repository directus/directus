import { createError, ErrorCode } from '../index.js';

export const InvalidTokenError = createError(ErrorCode.InvalidToken, 'Invalid token.', 403);
