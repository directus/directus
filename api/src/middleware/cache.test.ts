import { Request, Response } from 'express';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mockGetEnv = vi.fn();

vi.mock('../env', () => ({
	default: {},
	getEnv: mockGetEnv,
}));

import * as env from '../env';
import { getCacheKey } from '../utils/get-cache-key';
import { getCache, getCacheValue } from '../cache';

vi.mock('../cache', () => ({
	getCache: vi.fn().mockReturnValue({ cache: vi.fn() }),
	getCacheValue: vi.fn(),
}));

vi.mock('../services', () => {
	const ExportService = vi.fn();
	ExportService.prototype.transform = vi.fn();
	return { ExportService };
});

vi.mock('../utils/get-cache-key', () => ({
	getCacheKey: vi.fn().mockReturnValue('key'),
}));

vi.mock('../utils/get-cache-headers', () => ({
	getCacheControlHeader: vi.fn().mockReturnValue('CacheControlValue'),
}));

vi.mock('../logger', () => ({
	default: {
		warn: vi.fn(),
	},
}));

const modulePath = './cache.js';

let mockRequest: Partial<Request>;
let mockResponse: Partial<Response>;
const nextFunction = vi.fn();
const cacheStatusHeader = 'X-Directus-Cache';

beforeEach(() => {
	mockRequest = {};
	mockResponse = {
		json: vi.fn(),
		setHeader: vi.fn(),
	};
});

afterEach(() => {
	vi.clearAllMocks();
	vi.resetModules(); // reset checkCache module to "reset" env object
});

test('should skip if not GET method and not graphQL', async () => {
	const testEnv = {};
	(env.default as Record<string, any>) = testEnv;
	mockGetEnv.mockReturnValue(testEnv);

	mockRequest.method = 'POST';
	mockRequest.originalUrl = '/items/test';

	const checkCache = (await import(modulePath)).default;
	await checkCache(mockRequest as Request, mockResponse as Response, nextFunction);

	expect(getCacheKey).not.toHaveBeenCalled();
	expect(nextFunction).toHaveBeenCalledOnce();
});

test('should skip if CACHE_ENABLED environment variable is not true', async () => {
	const testEnv = { CACHE_ENABLED: false };
	(env.default as Record<string, any>) = testEnv;
	mockGetEnv.mockReturnValue(testEnv);

	mockRequest.method = 'GET';

	const checkCache = (await import(modulePath)).default;
	await checkCache(mockRequest as Request, mockResponse as Response, nextFunction);

	expect(getCacheKey).not.toHaveBeenCalled();
	expect(nextFunction).toHaveBeenCalledOnce();
});

test('should skip if CACHE_ENABLED environment variable is true but cache is missing', async () => {
	const testEnv = { CACHE_ENABLED: true };
	(env.default as Record<string, any>) = testEnv;
	mockGetEnv.mockReturnValue(testEnv);

	mockRequest.method = 'GET';
	vi.mocked(getCache).mockReturnValueOnce({ cache: undefined } as any);

	const checkCache = (await import(modulePath)).default;
	await checkCache(mockRequest as Request, mockResponse as Response, nextFunction);

	expect(getCacheKey).not.toHaveBeenCalled();
	expect(nextFunction).toHaveBeenCalledOnce();
});

test('should skip if request contains cache-control header set as "no-store" and set cache status header to MISS', async () => {
	const testEnv = { CACHE_ENABLED: true, CACHE_SKIP_ALLOWED: true, CACHE_STATUS_HEADER: cacheStatusHeader };
	(env.default as Record<string, any>) = testEnv;
	mockGetEnv.mockReturnValue(testEnv);

	mockRequest.method = 'GET';
	mockRequest.get = vi.fn((str) => {
		switch (str) {
			case 'cache-control':
				return 'no-store';
			default:
				return undefined;
		}
	});

	const checkCache = (await import(modulePath)).default;
	await checkCache(mockRequest as Request, mockResponse as Response, nextFunction);

	expect(mockResponse.setHeader).toHaveBeenCalledWith(cacheStatusHeader, 'MISS');
	expect(getCacheKey).not.toHaveBeenCalled();
	expect(nextFunction).toHaveBeenCalledOnce();
});

test('should skip if cache key is not found', async () => {
	const testEnv = { CACHE_ENABLED: true, CACHE_SKIP_ALLOWED: true, CACHE_STATUS_HEADER: cacheStatusHeader };
	(env.default as Record<string, any>) = testEnv;
	mockGetEnv.mockReturnValue(testEnv);

	mockRequest.method = 'GET';
	mockRequest.get = vi.fn((str) => {
		switch (str) {
			case 'cache-control':
				return 'no-store';
			default:
				return undefined;
		}
	});
	vi.mocked(getCacheValue).mockImplementation(() => Promise.reject({ message: 'fake error' }));

	const checkCache = (await import(modulePath)).default;
	await checkCache(mockRequest as Request, mockResponse as Response, nextFunction);

	expect(mockResponse.setHeader).toHaveBeenCalledWith(cacheStatusHeader, 'MISS');
	expect(nextFunction).toHaveBeenCalledOnce();
});

test('should set cache-control response header based on expiry date of found cache', async () => {
	const testEnv = { CACHE_ENABLED: true, CACHE_SKIP_ALLOWED: true, CACHE_STATUS_HEADER: cacheStatusHeader };
	(env.default as Record<string, any>) = testEnv;
	mockGetEnv.mockReturnValue(testEnv);

	mockRequest.method = 'GET';
	mockRequest.get = vi.fn(() => undefined);
	const mockedExpiryDateInTheFuture = Date.now() + 100000;
	vi.mocked(getCacheValue).mockImplementation(() => Promise.resolve({ exp: mockedExpiryDateInTheFuture }));

	const checkCache = (await import(modulePath)).default;
	await checkCache(mockRequest as Request, mockResponse as Response, nextFunction);

	expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', 'CacheControlValue'); //  'CacheControlValue' is mocked at the top
	expect(mockResponse.setHeader).toHaveBeenCalledWith('Vary', 'Origin, Cache-Control');
	expect(mockResponse.setHeader).toHaveBeenCalledWith(cacheStatusHeader, 'HIT');
	expect(mockResponse.json).toHaveBeenCalledOnce();
	expect(nextFunction).not.toHaveBeenCalled();
});
