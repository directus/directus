import { createError } from '@directus/errors';

export const InvalidProviderError = createError('INVALID_PROVIDER', 'Invalid provider.', 403);
