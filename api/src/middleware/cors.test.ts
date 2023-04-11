import type { Request, Response } from 'express';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import * as env from '../env.js';

vi.mock('../env', () => ({
	default: {},
}));

const modulePath = './cors.js';

let mockRequest: Partial<Request>;
let mockResponse: Partial<Response>;
const nextFunction = vi.fn();

const testOrigin = 'test.example.com';
// the vary module within cors module will throw error when getHeader() is not present
// ref: https://github.com/jshttp/vary/blob/5d725d059b3871025cf753e9dfa08924d0bcfa8f/index.js#L134-L137
const getHeader = vi.fn();
const setHeader = vi.fn();
const end = vi.fn();

beforeEach(() => {
	mockRequest = { method: 'OPTIONS', headers: { origin: testOrigin } };
	mockResponse = { getHeader, setHeader, end };
});

afterEach(() => {
	vi.clearAllMocks();
	vi.resetModules(); // reset cors module to "reset" env object
});

test('should not be enabled when CORS_ENABLED is false', async () => {
	(env.default as Record<string, any>) = {};
	const cors = (await import(modulePath)).default;
	cors(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(setHeader).not.toHaveBeenCalled();
});

test('should be enabled when CORS_ENABLED is true', async () => {
	(env.default as Record<string, any>) = { CORS_ENABLED: true };
	const cors = (await import(modulePath)).default;
	cors(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', testOrigin);
});

test('should set Access-Control-Allow-Origin to test origin when CORS_ORIGIN is true', async () => {
	(env.default as Record<string, any>) = { CORS_ENABLED: true, CORS_ORIGIN: true };
	const cors = (await import(modulePath)).default;
	cors(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', testOrigin);
});

test('should set Access-Control-Allow-Origin to wildcard when CORS_ORIGIN is *', async () => {
	(env.default as Record<string, any>) = { CORS_ENABLED: true, CORS_ORIGIN: '*' };
	const cors = (await import(modulePath)).default;
	cors(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
});

test('should set Access-Control-Allow-Methods when CORS_METHODS is configured', async () => {
	const methods = 'GET,POST';
	(env.default as Record<string, any>) = { CORS_ENABLED: true, CORS_METHODS: methods };
	const cors = (await import(modulePath)).default;
	cors(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', methods);
});

test('should set Access-Control-Allow-Headers when CORS_ALLOWED_HEADERS is configured', async () => {
	const header = 'X-Test-Header';
	(env.default as Record<string, any>) = { CORS_ENABLED: true, CORS_ALLOWED_HEADERS: header };
	const cors = (await import(modulePath)).default;
	cors(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', header);
});

test('should set Access-Control-Allow-Headers when CORS_ALLOWED_HEADERS is configured', async () => {
	const header = 'X-Test-Header';
	(env.default as Record<string, any>) = { CORS_ENABLED: true, CORS_ALLOWED_HEADERS: header };
	const cors = (await import(modulePath)).default;
	cors(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', header);
});

test('should set Access-Control-Allow-Credentials when CORS_CREDENTIALS is true', async () => {
	const credentials = true;
	(env.default as Record<string, any>) = { CORS_ENABLED: true, CORS_CREDENTIALS: credentials };
	const cors = (await import(modulePath)).default;
	cors(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(setHeader).toHaveBeenCalledWith('Access-Control-Allow-Credentials', String(credentials));
});

test('should not set Access-Control-Allow-Credentials when CORS_CREDENTIALS is false', async () => {
	const credentials = false;
	(env.default as Record<string, any>) = { CORS_ENABLED: true, CORS_CREDENTIALS: credentials };
	const cors = (await import(modulePath)).default;
	cors(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(setHeader).not.toHaveBeenCalledWith('Access-Control-Allow-Credentials', expect.anything());
});

test('should set Access-Control-Max-Age when CORS_MAX_AGE is configured', async () => {
	const maxAge = 8055;
	(env.default as Record<string, any>) = { CORS_ENABLED: true, CORS_MAX_AGE: maxAge };
	const cors = (await import(modulePath)).default;
	cors(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(setHeader).toHaveBeenCalledWith('Access-Control-Max-Age', String(maxAge));
});

test('should not set Access-Control-Max-Age when CORS_MAX_AGE is undefined', async () => {
	(env.default as Record<string, any>) = { CORS_ENABLED: true, CORS_MAX_AGE: undefined };
	const cors = (await import(modulePath)).default;
	cors(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(setHeader).not.toHaveBeenCalledWith('Access-Control-Max-Age', expect.anything());
});
