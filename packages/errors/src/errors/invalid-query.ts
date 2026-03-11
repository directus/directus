import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export interface InvalidQueryErrorExtensions {
	reason: string;
}

export const messageConstructor = ({ reason }: InvalidQueryErrorExtensions) => `Invalid query. ${reason}.`;

export const InvalidQueryError: DirectusErrorConstructor<InvalidQueryErrorExtensions> =
	createError<InvalidQueryErrorExtensions>(ErrorCode.InvalidQuery, messageConstructor, 400);
