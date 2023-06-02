import { createError } from '@directus/errors';

export interface InvalidQueryErrorExtensions {
	reason: string;
}

export const messageConstructor = ({ reason }: InvalidQueryErrorExtensions) => `Invalid query. ${reason}.`;

export const InvalidQueryError = createError<InvalidQueryErrorExtensions>('INVALID_QUERY', messageConstructor, 400);
