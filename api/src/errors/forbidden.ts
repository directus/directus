import { createError } from '@directus/errors';
import { ErrorCode } from './codes.js';

export const ForbiddenError = createError(ErrorCode.Forbidden, `You don't have permission to access this.`, 403);
