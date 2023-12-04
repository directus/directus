import { HitRateLimitError } from '@directus/errors';
import type { IRateLimiterRes } from 'rate-limiter-flexible';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { LimiterLocal } from './local.js';

vi.mock('rate-limiter-flexible');

let limiter: LimiterLocal;
let points: number;
let duration: number;
let key: string;

beforeEach(() => {
	points = 5;
	duration = 10;
	key = 'rate-limiter-key';
	limiter = new LimiterLocal({ points, duration });

	vi.useFakeTimers();
});

afterEach(() => {
	vi.clearAllMocks();
	vi.useRealTimers();
});

describe('constructor', () => {
	test('Creates rate-limiter with correct config', () => {
		expect(limiter['limiter']).toBeInstanceOf(RateLimiterMemory);
		expect(RateLimiterMemory).toHaveBeenCalledWith({ points, duration });
	});
});

describe('consume', () => {
	test('Consumes point from rate-limiter', async () => {
		await limiter.consume(key);
		expect(limiter['limiter'].consume).toHaveBeenCalledWith(key);
	});

	test('Rejects error as-is if error instance is given', async () => {
		const mockError = new Error('test');
		vi.mocked(limiter['limiter'].consume).mockRejectedValue(mockError);

		expect(() => limiter.consume(key)).rejects.toBe(mockError);
	});

	test('Rejects HitRateLimitError', async () => {
		const systemTime = new Date('2023-12-04T00:00:00.000Z');
		vi.setSystemTime(systemTime);

		const mockMsBeforeNext = 1500;
		const mockRes = { msBeforeNext: mockMsBeforeNext } as IRateLimiterRes;
		vi.mocked(limiter['limiter'].consume).mockRejectedValue(mockRes);

		let res: any;

		try {
			await limiter.consume(key);
		} catch (err) {
			res = err;
		}

		expect(res).toBeInstanceOf(HitRateLimitError);

		expect(res.extensions).toEqual({
			limit: points,
			reset: new Date(systemTime.getTime() + mockMsBeforeNext),
		});
	});
});

describe('delete', () => {
	test('Calls limiter delete', async () => {
		await limiter.delete(key);
		expect(limiter['limiter'].delete).toHaveBeenCalledWith(key);
	});
});
