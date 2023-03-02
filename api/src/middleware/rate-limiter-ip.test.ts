import { Request, Response } from 'express';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import * as env from '../env';

vi.mock('../env', () => ({
	default: {},
}));

import { createRateLimiter } from '../rate-limiter';

vi.mock('../rate-limiter', () => ({
	createRateLimiter: vi.fn().mockReturnValue({
		consume: vi.fn(),
	}),
}));

const modulePath = './rate-limiter-ip.js';

let mockRequest: Partial<Request>;
let mockResponse: Partial<Response>;
const nextFunction = vi.fn();
const resSet = vi.fn();

beforeEach(() => {
	mockRequest = {};
	mockResponse = { set: resSet };
});

afterEach(() => {
	vi.clearAllMocks();
	vi.resetModules(); // reset rate limiter module to "reset" env object
});

test('should not be enabled when RATE_LIMITER_ENABLED is false', async () => {
	(env.default as Record<string, any>) = { RATE_LIMITER_ENABLED: false };

	const checkRateLimit = (await import(modulePath)).default;
	await checkRateLimit(mockRequest as Request, mockResponse as Response, nextFunction);

	expect(createRateLimiter).not.toHaveBeenCalled();
});

test('should be enabled when RATE_LIMITER_ENABLED is true', async () => {
	(env.default as Record<string, any>) = {
		RATE_LIMITER_ENABLED: true,
		RATE_LIMITER_STORE: 'memory',
		RATE_LIMITER_DURATION: 1,
		RATE_LIMITER_POINTS: 25,
	};

	const checkRateLimit = (await import(modulePath)).default;
	checkRateLimit(mockRequest as Request, mockResponse as Response, nextFunction);

	expect(createRateLimiter).toHaveBeenCalled();
});

test('should consume rate limit based on IP', async () => {
	(env.default as Record<string, any>) = {
		RATE_LIMITER_ENABLED: true,
		RATE_LIMITER_STORE: 'memory',
		RATE_LIMITER_DURATION: 1,
		RATE_LIMITER_POINTS: 25,
	};
	const requestIP = '10.10.10.1';
	mockRequest = { ip: requestIP };
	const consumeSpy = vi.spyOn(createRateLimiter(), 'consume');

	const checkRateLimit = (await import(modulePath)).default;
	await checkRateLimit(mockRequest as Request, mockResponse as Response, nextFunction);

	expect(consumeSpy).toHaveBeenCalledWith(requestIP, expect.any(Number));
});

test('should set Retry-After response header and pass HitRateLimitException error to next()', async () => {
	const points = 25;
	(env.default as Record<string, any>) = {
		RATE_LIMITER_ENABLED: true,
		RATE_LIMITER_STORE: 'memory',
		RATE_LIMITER_DURATION: 1,
		RATE_LIMITER_POINTS: points,
	};
	const requestIP = '10.10.10.1';
	mockRequest = { ip: requestIP };
	const msBeforeNext = 10000;
	vi.spyOn(createRateLimiter(), 'consume').mockImplementation(() => Promise.reject({ msBeforeNext }));

	const checkRateLimit = (await import(modulePath)).default;
	await checkRateLimit(mockRequest as Request, mockResponse as Response, nextFunction);

	expect(mockResponse.set).toHaveBeenCalledWith('Retry-After', expect.any(String));
	expect(nextFunction.mock.calls[0][0].status).toBe(429);
	expect(nextFunction.mock.calls[0][0].code).toBe('REQUESTS_EXCEEDED');
	expect(nextFunction.mock.calls[0][0].message).toBe(`Too many requests, retry after ${msBeforeNext / 1000}s.`);
	expect(nextFunction.mock.calls[0][0].extensions?.limit).toBe(points);
});
