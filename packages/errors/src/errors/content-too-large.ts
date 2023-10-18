import { createError, ErrorCode } from '../index.js';

export const ContentTooLargeError = createError(ErrorCode.ContentTooLarge, 'Uploaded content is too large.', 413);
