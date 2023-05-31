import { createError } from '@directus/errors';

export const TokenExpiredError = createError('TOKEN_EXPIRED', 'Token expired.', 401);
