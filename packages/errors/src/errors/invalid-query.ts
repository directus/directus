import { createError, ErrorCode, withZodSupport, type ZodAwareErrorConstructor } from '../index.js';

export interface InvalidQueryErrorExtensions {
	reason: string;
}

export const messageConstructor = ({ reason }: InvalidQueryErrorExtensions) => `Invalid query. ${reason}.`;

export const InvalidQueryError: ZodAwareErrorConstructor<InvalidQueryErrorExtensions> = withZodSupport(
	createError<InvalidQueryErrorExtensions>(ErrorCode.InvalidQuery, messageConstructor, 400),
);
