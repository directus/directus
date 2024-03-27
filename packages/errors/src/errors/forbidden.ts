import { createError, ErrorCode } from '../index.js';

export const ForbiddenError = createError(ErrorCode.Forbidden, `You don't have permission to access this.`, 403);
