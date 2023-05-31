import { createError } from '@directus/errors';

export const ForbiddenError = createError('FORBIDDEN', `You don't have permission to access this.`, 403);
