import { Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mockGetEnv = vi.fn();

vi.mock('../env', () => ({
	default: {},
	getEnv: mockGetEnv,
}));

import * as env from '../env';

vi.mock('../cache', () => ({
	getCache: vi.fn().mockReturnValue({ cache: vi.fn() }),
	setCacheValue: vi.fn().mockResolvedValue(true),
}));

vi.mock('../services', () => {
	const ExportService = vi.fn();
	ExportService.prototype.transform = vi.fn();
	return { ExportService };
});

vi.mock('../utils/get-cache-key', () => ({
	getCacheKey: vi.fn(),
}));

vi.mock('../utils/get-cache-headers', () => ({
	getCacheControlHeader: vi.fn().mockReturnValue('CacheControlValue'),
}));

vi.mock('../utils/get-date-formatted', () => ({
	getDateFormatted: vi.fn().mockReturnValue('2022-12-12-123456'),
}));

const modulePath = './respond';

let mockRequest: Partial<Request>;
let mockResponse: Partial<Response>;
const nextFunction = vi.fn();
const mockedDateFormatted = '2022-12-12-123456';

beforeEach(() => {
	mockRequest = {
		method: 'GET',
		sanitizedQuery: {},
	};
	mockResponse = {
		attachment: vi.fn(),
		end: vi.fn() as any,
		json: vi.fn(),
		set: vi.fn(),
		setHeader: vi.fn(),
		status: vi.fn().mockReturnValue({
			send: vi.fn(),
			end: vi.fn(),
		}),
	};
});

afterEach(() => {
	vi.clearAllMocks();
	vi.resetModules(); // reset respond module to "reset" env object
});

describe('cache header', () => {
	test('should set headers to no cache by default', async () => {
		const testEnv = { CACHE_ENABLED: false, CACHE_VALUE_MAX_SIZE: false };
		(env.default as Record<string, any>) = testEnv;
		mockGetEnv.mockReturnValue(testEnv);

		const { respond } = await import(modulePath);
		await respond(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
		expect(mockResponse.setHeader).toHaveBeenCalledWith('Vary', 'Origin, Cache-Control');
	});

	test('should cache', async () => {
		const testEnv = { CACHE_ENABLED: true, CACHE_VALUE_MAX_SIZE: false, CACHE_TTL: '5m' };
		(env.default as Record<string, any>) = testEnv;
		mockGetEnv.mockReturnValue(testEnv);

		mockResponse.locals = { cache: true, payload: {} };

		const { respond } = await import(modulePath);
		await respond(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', 'CacheControlValue'); // 'CacheControlValue' is mocked at the top
		expect(mockResponse.setHeader).toHaveBeenCalledWith('Vary', 'Origin, Cache-Control');
	});
});

describe('export', () => {
	test.each([
		{ type: 'json', contentType: 'application/json' },
		{ type: 'xml', contentType: 'text/xml' },
		{ type: 'csv', contentType: 'text/csv' },
	])('should attach $type file and set Content-Type header to $contentType', async ({ type, contentType }) => {
		const testEnv = { CACHE_ENABLED: false, CACHE_VALUE_MAX_SIZE: false };
		(env.default as Record<string, any>) = testEnv;
		mockGetEnv.mockReturnValue(testEnv);

		mockRequest = { ...mockRequest, sanitizedQuery: { export: type as any } };

		const { respond } = await import(modulePath);
		await respond(mockRequest as Request, mockResponse as Response, nextFunction);

		// regex to test whether exported filename ends with <date-formatted>.<file-type>
		const regex = new RegExp(`${mockedDateFormatted}.${type}$`);
		expect(mockResponse.attachment).toHaveBeenCalledWith(expect.stringMatching(regex));
		expect(mockResponse.set).toHaveBeenCalledWith('Content-Type', contentType);
	});
});

describe('res', () => {
	test('should use res.end when payload is buffer', async () => {
		const testEnv = { CACHE_ENABLED: false, CACHE_VALUE_MAX_SIZE: false };
		(env.default as Record<string, any>) = testEnv;
		mockGetEnv.mockReturnValue(testEnv);

		const payload = Buffer.from('test');
		mockResponse.locals = { payload };

		const { respond } = await import(modulePath);
		await respond(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(mockResponse.end).toHaveBeenCalledWith(payload);
	});

	test('should use res.json when payload is present and not a buffer', async () => {
		const testEnv = { CACHE_ENABLED: false, CACHE_VALUE_MAX_SIZE: false };
		(env.default as Record<string, any>) = testEnv;
		mockGetEnv.mockReturnValue(testEnv);

		const payload = { key: 'test' };
		mockResponse.locals = { payload };

		const { respond } = await import(modulePath);
		await respond(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(mockResponse.json).toHaveBeenCalledWith(payload);
	});

	test('should send empty reply with status 204 No Content when no payload is present', async () => {
		const testEnv = { CACHE_ENABLED: false, CACHE_VALUE_MAX_SIZE: false };
		(env.default as Record<string, any>) = testEnv;
		mockGetEnv.mockReturnValue(testEnv);

		mockResponse.locals = {};

		const { respond } = await import(modulePath);
		await respond(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(mockResponse.status).toHaveBeenCalledWith(204);
	});
});
