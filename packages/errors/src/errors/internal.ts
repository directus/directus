import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export const InternalServerError: DirectusErrorConstructor<void> = createError(
	ErrorCode.Internal,
	`An unexpected error occurred.`,
);
