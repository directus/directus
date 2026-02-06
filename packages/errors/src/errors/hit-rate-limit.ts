import ms from 'ms';
import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export interface HitRateLimitErrorExtensions {
	limit: number;
	reset: Date;
}

export const messageConstructor = (extensions: HitRateLimitErrorExtensions) => {
	const msBeforeNext = extensions.reset.getTime() - Date.now();
	return `Too many requests, retry after ${ms(msBeforeNext)}.`;
};

export const HitRateLimitError: DirectusErrorConstructor<HitRateLimitErrorExtensions> =
	createError<HitRateLimitErrorExtensions>(ErrorCode.RequestsExceeded, messageConstructor, 429);
