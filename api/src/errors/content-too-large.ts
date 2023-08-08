import { createError } from '@directus/errors';
import { ErrorCode } from './codes.js';

export const ContentTooLargeError = createError(ErrorCode.ContentTooLarge, 'Uploaded content is too large.', 413);
