import { createError } from '@directus/errors';

export const ContentTooLargeError = createError('CONTENT_TOO_LARGE', 'Uploaded content is too large.', 413);
