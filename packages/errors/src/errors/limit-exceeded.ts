import { createError, ErrorCode } from '../index.js';

export interface LimitExceededErrorExtensions {
	message: string;
}

export const messageConstructor = (extensions?: LimitExceededErrorExtensions) =>
	`${extensions?.message ? extensions.message : 'Limit exceeded.'}`;

export const LimitExceededError = createError<LimitExceededErrorExtensions>(
	ErrorCode.LimitExceeded,
	messageConstructor,
	403,
);
