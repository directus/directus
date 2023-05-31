import { createError } from '@directus/errors';

export const InvalidCredentialsError = createError('INVALID_CREDENTIALS', 'Invalid user credentials.', 401);
