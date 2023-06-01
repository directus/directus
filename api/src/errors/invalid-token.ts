import { createError } from '@directus/errors';

export const InvalidTokenError = createError('INVALID_TOKEN', 'Invalid token.', 403);