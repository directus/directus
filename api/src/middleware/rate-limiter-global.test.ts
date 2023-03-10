import { Request, Response } from 'express';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mockGetEnv = vi.fn();

vi.mock('../env', () => ({
	default: {},
	getEnv: mockGetEnv,
}));

import * as env from '../env';

import logger from '../logger';
import { createRateLimiter } from '../rate-limiter';

vi.mock('../logger', () => ({
	default: {
		error: vi.fn(),
	},
}));

vi.mock('../rate-limiter', () => ({
	createRateLimiter: vi.fn().mockReturnValue({ consume: vi.fn() }),
}));

const modulePath = './rate-limiter-global.js';

let mockRequest: Partial<Request>;
let mockResponse: Partial<Response>;
const nextFunction = vi.fn();
const resSet = vi.fn();

beforeEach(() => {
	mockRequest = {};
	mockResponse = { set: resSet };

	// mock process exit to prevent test from stopping
	vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
});

afterEach(() => {
	vi.clearAllMocks();
	vi.resetModules(); // reset rate limiter global module to "reset" env object
});

test('should not be enabled when RATE_LIMITER_GLOBAL_ENABLED is false', async () => {
	const testEnv = { RATE_LIMITER_GLOBAL_ENABLED: false };
	(env.default as Record<string, any>) = testEnv;
	mockGetEnv.mockReturnValue(testEnv);

	const checkRateLimit = (await import(modulePath)).default;

	await checkRateLimit(mockRequest as Request, mockResponse as Response, nextFunction);

	expect(logger.error).not.toHaveBeenCalled();
	expect(process.exit).not.toHaveBeenCalled();
	expect(createRateLimiter).not.toHaveBeenCalled();
});

test('should throw error when RATE_LIMITER_GLOBAL_ENABLED is true but RATE_LIMITER_ENABLED is not true', async () => {
	const testEnv = {
		RATE_LIMITER_GLOBAL_ENABLED: true,
		RATE_LIMITER_GLOBAL_STORE: 'memory',
		RATE_LIMITER_GLOBAL_DURATION: 1,
		RATE_LIMITER_GLOBAL_POINTS: 25,
	};
	(env.default as Record<string, any>) = testEnv;
	mockGetEnv.mockReturnValue(testEnv);

	const checkRateLimit = (await import(modulePath)).default;

	await checkRateLimit(mockRequest as Request, mockResponse as Response, nextFunction);

	expect(logger.error).toHaveBeenCalled();
	expect(process.exit).toHaveBeenCalled();
});

test('should throw error when global points per second is lower than regular/ip points per second', async () => {
	const testEnv = {
		RATE_LIMITER_ENABLED: true,
		RATE_LIMITER_STORE: 'memory',
		RATE_LIMITER_DURATION: 1,
		RATE_LIMITER_POINTS: 25,
		RATE_LIMITER_GLOBAL_ENABLED: true,
		RATE_LIMITER_GLOBAL_STORE: 'memory',
		RATE_LIMITER_GLOBAL_DURATION: 1,
		RATE_LIMITER_GLOBAL_POINTS: 20,
	};
	(env.default as Record<string, any>) = testEnv;
	mockGetEnv.mockReturnValue(testEnv);

	const checkRateLimit = (await import(modulePath)).default;

	await checkRateLimit(mockRequest as Request, mockResponse as Response, nextFunction);

	expect(logger.error).toHaveBeenCalled();
	expect(process.exit).toHaveBeenCalled();
});

test('should not throw error when global points per second is higher than regular/ip points per second', async () => {
	const testEnv = {
		RATE_LIMITER_ENABLED: true,
		RATE_LIMITER_STORE: 'memory',
		RATE_LIMITER_DURATION: 1,
		RATE_LIMITER_POINTS: 25,
		RATE_LIMITER_GLOBAL_ENABLED: true,
		RATE_LIMITER_GLOBAL_STORE: 'memory',
		RATE_LIMITER_GLOBAL_DURATION: 1,
		RATE_LIMITER_GLOBAL_POINTS: 30,
	};
	(env.default as Record<string, any>) = testEnv;
	mockGetEnv.mockReturnValue(testEnv);

	const checkRateLimit = (await import(modulePath)).default;

	await checkRateLimit(mockRequest as Request, mockResponse as Response, nextFunction);

	expect(logger.error).not.toHaveBeenCalled();
	expect(process.exit).not.toHaveBeenCalled();
	expect(createRateLimiter).toHaveBeenCalled();
});

test('should consume rate limit', async () => {
	const testEnv = {
		RATE_LIMITER_ENABLED: true,
		RATE_LIMITER_STORE: 'memory',
		RATE_LIMITER_DURATION: 1,
		RATE_LIMITER_POINTS: 25,
		RATE_LIMITER_GLOBAL_ENABLED: true,
		RATE_LIMITER_GLOBAL_STORE: 'memory',
		RATE_LIMITER_GLOBAL_DURATION: 1,
		RATE_LIMITER_GLOBAL_POINTS: 30,
	};
	(env.default as Record<string, any>) = testEnv;
	mockGetEnv.mockReturnValue(testEnv);

	const consumeSpy = vi.spyOn(createRateLimiter(), 'consume');

	const checkRateLimit = (await import(modulePath)).default;
	await checkRateLimit(mockRequest as Request, mockResponse as Response, nextFunction);

	expect(consumeSpy).toHaveBeenCalledWith(expect.any(String), expect.any(Number));
});

test('should set Retry-After response header and pass HitRateLimitException error to next()', async () => {
	const points = 30;

	const testEnv = {
		RATE_LIMITER_ENABLED: true,
		RATE_LIMITER_STORE: 'memory',
		RATE_LIMITER_DURATION: 1,
		RATE_LIMITER_POINTS: 25,
		RATE_LIMITER_GLOBAL_ENABLED: true,
		RATE_LIMITER_GLOBAL_STORE: 'memory',
		RATE_LIMITER_GLOBAL_DURATION: 1,
		RATE_LIMITER_GLOBAL_POINTS: points,
	};
	(env.default as Record<string, any>) = testEnv;
	mockGetEnv.mockReturnValue(testEnv);

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
