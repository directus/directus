import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export interface LimitExceededErrorExtensions {
	category: string;
}

export const messageConstructor = ({ category }: LimitExceededErrorExtensions) => {
	return `${category} limit exceeded.`;
};

export const LimitExceededError: DirectusErrorConstructor<LimitExceededErrorExtensions> =
	createError<LimitExceededErrorExtensions>(ErrorCode.LimitExceeded, messageConstructor, 403);
