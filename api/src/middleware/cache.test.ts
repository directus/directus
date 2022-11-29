import { Request, Response } from 'express';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import * as env from '../env';
import { getCacheKey } from '../utils/get-cache-key';
import { getCache, getCacheValue } from '../cache';

vi.mock('../env', () => ({
	default: {},
}));

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

const modulePath = './cache';

let mockRequest: Partial<Request>;
let mockResponse: Partial<Response>;
const nextFunction = vi.fn();
const cacheStatusHeader = 'X-Directus-Cache';

beforeEach(() => {
	mockRequest = { headers: {} };
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
	(env.default as Record<string, any>) = {};
	mockRequest.method = 'POST';
	mockRequest.originalUrl = '/items/test';

	const checkCache = (await import(modulePath)).default;
	await checkCache(mockRequest as Request, mockResponse as Response, nextFunction);

	expect(getCacheKey).not.toHaveBeenCalled();
	expect(nextFunction).toHaveBeenCalledOnce();
});

test('should skip if CACHE_ENABLED environment variable is not true', async () => {
	(env.default as Record<string, any>) = { CACHE_ENABLED: false };
	mockRequest.method = 'GET';

	const checkCache = (await import(modulePath)).default;
	await checkCache(mockRequest as Request, mockResponse as Response, nextFunction);

	expect(getCacheKey).not.toHaveBeenCalled();
	expect(nextFunction).toHaveBeenCalledOnce();
});

test('should skip if CACHE_ENABLED environment variable is true but cache is missing', async () => {
	(env.default as Record<string, any>) = { CACHE_ENABLED: true };
	mockRequest.method = 'GET';
	vi.mocked(getCache).mockReturnValueOnce({ cache: undefined } as any);

	const checkCache = (await import(modulePath)).default;
	await checkCache(mockRequest as Request, mockResponse as Response, nextFunction);

	expect(getCacheKey).not.toHaveBeenCalled();
	expect(nextFunction).toHaveBeenCalledOnce();
});

test('should skip if request contains cache-control header set as "no-store" and set cache status header to MISS', async () => {
	(env.default as Record<string, any>) = { CACHE_ENABLED: true, CACHE_STATUS_HEADER: cacheStatusHeader };
	mockRequest.method = 'GET';
	mockRequest.headers = { 'cache-control': 'no-store' };

	const checkCache = (await import(modulePath)).default;
	await checkCache(mockRequest as Request, mockResponse as Response, nextFunction);

	expect(mockResponse.setHeader).toHaveBeenCalledWith(cacheStatusHeader, 'MISS');
	expect(getCacheKey).not.toHaveBeenCalled();
	expect(nextFunction).toHaveBeenCalledOnce();
});

test('should skip if cache key is not found', async () => {
	(env.default as Record<string, any>) = { CACHE_ENABLED: true, CACHE_STATUS_HEADER: cacheStatusHeader };
	mockRequest.method = 'GET';
	vi.mocked(getCacheValue).mockImplementation(() => Promise.reject({ message: 'fake error' }));

	const checkCache = (await import(modulePath)).default;
	await checkCache(mockRequest as Request, mockResponse as Response, nextFunction);

	expect(mockResponse.setHeader).toHaveBeenCalledWith(cacheStatusHeader, 'MISS');
	expect(nextFunction).toHaveBeenCalledOnce();
});

test('should set cache-control response header based on expiry date of found cache', async () => {
	(env.default as Record<string, any>) = { CACHE_ENABLED: true, CACHE_STATUS_HEADER: cacheStatusHeader };
	mockRequest.method = 'GET';
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
