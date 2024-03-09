import { createError, ErrorCode } from '../index.js';

export const LimitExceededError = createError(ErrorCode.LimitExceeded, 'Limit exceeded.', 403);
