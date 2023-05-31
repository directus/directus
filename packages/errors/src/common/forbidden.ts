import { createError } from '../create-error.js';

export const ForbiddenError = createError('FORBIDDEN', `You don't have permission to access this.`, 403);
