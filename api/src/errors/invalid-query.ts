import { createError } from '@directus/errors';
import { ErrorCode } from './codes.js';

export interface InvalidQueryErrorExtensions {
	reason: string;
}

export const messageConstructor = ({ reason }: InvalidQueryErrorExtensions) => `Invalid query. ${reason}.`;

export const InvalidQueryError = createError<InvalidQueryErrorExtensions>(
	ErrorCode.InvalidQuery,
	messageConstructor,
	400
);
