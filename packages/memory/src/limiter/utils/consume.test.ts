import { HitRateLimitError } from '@directus/errors';
import { RateLimiterMemory, type IRateLimiterRes } from 'rate-limiter-flexible';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { consume } from './consume.js';

vi.mock('rate-limiter-flexible');

let limiter: RateLimiterMemory;
let key: string;
let points: number;

beforeEach(() => {
	key = 'limiter-test-key';
	points = 5;
	limiter = new RateLimiterMemory({ points, duration: 15 });

	vi.useFakeTimers();
});

afterEach(() => {
	vi.clearAllMocks();
	vi.useRealTimers();
});

test('Consumes point from rate-limiter', async () => {
	await consume(limiter, key, points);
	expect(limiter.consume).toHaveBeenCalledWith(key);
});

test('Rejects error as-is if error instance is given', async () => {
	const mockError = new Error('test');
	vi.mocked(limiter.consume).mockRejectedValue(mockError);

	expect(() => consume(limiter, key, points)).rejects.toBe(mockError);
});

test('Rejects HitRateLimitError', async () => {
	const systemTime = new Date('2023-12-04T00:00:00.000Z');
	vi.setSystemTime(systemTime);

	const mockMsBeforeNext = 1500;
	const mockRes = { msBeforeNext: mockMsBeforeNext } as IRateLimiterRes;
	vi.mocked(limiter.consume).mockRejectedValue(mockRes);

	let res: any;

	try {
		await consume(limiter, key, points);
	} catch (err) {
		res = err;
	}

	expect(res).toBeInstanceOf(HitRateLimitError);

	expect(res.extensions).toEqual({
		limit: points,
		reset: new Date(systemTime.getTime() + mockMsBeforeNext),
	});
});
