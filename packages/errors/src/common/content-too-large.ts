import { createError } from '../create-error.js';

export const ContentTooLargeError = createError('CONTENT_TOO_LARGE', 'Uploaded content is too large.', 413);
