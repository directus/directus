import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export const ContentTooLargeError: DirectusErrorConstructor<void> = createError(
	ErrorCode.ContentTooLarge,
	'Uploaded content is too large.',
	413,
);
