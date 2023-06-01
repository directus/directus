import ms from 'ms';
import { createError } from '@directus/errors';

export interface HitRateLimitErrorExtensions {
	limit: number;
	reset: Date;
}

export const messageConstructor = (extensions: HitRateLimitErrorExtensions) => {
	const msBeforeNext = extensions.reset.getTime() - Date.now();
	return `Too many requests, retry after ${ms(msBeforeNext)}.`;
};

export const HitRateLimitError = createError<HitRateLimitErrorExtensions>('REQUESTS_EXCEEDED', messageConstructor, 429);
