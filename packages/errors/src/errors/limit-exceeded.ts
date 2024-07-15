import { createError, ErrorCode } from '../index.js';

export interface LimitExceededErrorExtensions {
	category: string;
}

export const messageConstructor = ({ category }: LimitExceededErrorExtensions) => {
	return `${category} limit exceeded.`;
};

export const LimitExceededError = createError<LimitExceededErrorExtensions>(
	ErrorCode.LimitExceeded,
	messageConstructor,
	403,
);
