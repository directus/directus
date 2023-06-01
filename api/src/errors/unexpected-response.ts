import { createError } from '@directus/errors';

export const UnexpectedResponseError = createError('UNEXPECTED_RESPONSE', 'Received an unexpected response.', 503);
