import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export const UnexpectedResponseError: DirectusErrorConstructor<void> = createError(
	ErrorCode.UnexpectedResponse,
	'Received an unexpected response.',
	503,
);
