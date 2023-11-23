import { createError, ErrorCode } from '../index.js';

export const UnexpectedResponseError = createError(
	ErrorCode.UnexpectedResponse,
	'Received an unexpected response.',
	503,
);
