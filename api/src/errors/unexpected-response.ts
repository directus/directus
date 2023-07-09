import { createError } from '@directus/errors';
import { ErrorCode } from './codes.js';

export const UnexpectedResponseError = createError(
	ErrorCode.UnexpectedResponse,
	'Received an unexpected response.',
	503
);
