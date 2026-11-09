import type { ExtensionSandboxRequestedScopes } from '@directus/extensions';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { Reference } from 'isolated-vm';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getAxios } from '../../../../../request/index.js';
import { requestGenerator } from './request.js';

vi.mock('../../../../../request/index.js', () => ({
	getAxios: vi.fn(),
}));

const mockAxios = vi.fn();

const response = { status: 200, statusText: 'OK', headers: { 'content-type': 'text/plain' }, data: 'response body' };

const requestedScopes: ExtensionSandboxRequestedScopes = {
	request: { methods: ['GET', 'POST'], urls: ['https://allowed.example/**'] },
};

beforeEach(() => {
	vi.clearAllMocks();
	mockAxios.mockResolvedValue(response);
	vi.mocked(getAxios).mockResolvedValue(mockAxios as unknown as AxiosInstance);
});

function reference(value: unknown): Reference<any> {
	return {
		typeof: typeof value,
		copy: async () => value,
		get: async (key: string) => reference((value as Record<string, unknown>)[key]),
	} as unknown as Reference<any>;
}

function request(url: unknown, options?: unknown, scopes = requestedScopes) {
	return requestGenerator(scopes)(reference(url), reference(options));
}

async function redirectTo(href: string) {
	await request('https://allowed.example/start');

	const { beforeRedirect } = mockAxios.mock.calls[0]![0] as AxiosRequestConfig;

	return () => beforeRedirect!({ href }, {} as never, {} as never);
}

describe('requestGenerator', () => {
	describe('argument validation', () => {
		test.each([
			{ case: 'url is not a string', url: 42, options: undefined, error: 'Request url has to be of type string' },
			{
				case: 'options are not an object',
				url: 'https://allowed.example/path',
				options: 'GET',
				error: 'Request options has to be of type object',
			},
			{
				case: 'method is not a string',
				url: 'https://allowed.example/path',
				options: { method: 1 },
				error: 'Request method has to be of type string',
			},
			{
				case: 'body is not a string or object',
				url: 'https://allowed.example/path',
				options: { body: 1 },
				error: 'Request body has to be of type string or object',
			},
			{
				case: 'headers are not an object',
				url: 'https://allowed.example/path',
				options: { headers: 'Authorization: Bearer token' },
				error: 'Request headers has to be of type object',
			},
		])('should reject when the $case', async ({ url, options, error }) => {
			await expect(request(url, options)).rejects.toThrow(new TypeError(error));

			expect(mockAxios).not.toHaveBeenCalled();
		});
	});

	describe('request scope', () => {
		test('should reject when the request scope is not granted', async () => {
			await expect(request('https://allowed.example/path', undefined, {})).rejects.toThrow(
				'No permission to access "request"',
			);

			expect(mockAxios).not.toHaveBeenCalled();
		});
	});

	describe('url scope', () => {
		test('should reject a url outside the scope without requesting it', async () => {
			await expect(request('https://blocked.example/path')).rejects.toThrow(
				'No permission to request "https://blocked.example/path"',
			);

			expect(mockAxios).not.toHaveBeenCalled();
		});

		test('should allow a redirect within the scope', async () => {
			expect(await redirectTo('https://allowed.example/next')).not.toThrow();
		});

		test('should reject a redirect outside the scope', async () => {
			expect(await redirectTo('https://blocked.example/next')).toThrow(
				'No permission to request "https://blocked.example/next"',
			);
		});
	});

	describe('method scope', () => {
		test('should reject a method that is not granted', async () => {
			await expect(request('https://allowed.example/path', { method: 'DELETE' })).rejects.toThrow(
				'No permission to use request method "DELETE"',
			);

			expect(mockAxios).not.toHaveBeenCalled();
		});

		test('should reject the default GET method when it is not granted', async () => {
			const scopes = { request: { methods: ['POST' as const], urls: ['https://allowed.example/**'] } };

			await expect(request('https://allowed.example/path', undefined, scopes)).rejects.toThrow(
				'No permission to use request method',
			);

			expect(mockAxios).not.toHaveBeenCalled();
		});
	});

	describe('outgoing request', () => {
		test('should send a GET request without a body or headers by default', async () => {
			await request('https://allowed.example/path');

			expect(mockAxios).toHaveBeenCalledWith(
				expect.objectContaining({ url: 'https://allowed.example/path', method: 'GET', data: null, headers: {} }),
			);
		});

		test('should send the given method, body and headers', async () => {
			await request('https://allowed.example/path', {
				method: 'POST',
				body: { title: 'Hello' },
				headers: { Authorization: 'Bearer token' },
			});

			expect(mockAxios).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					data: { title: 'Hello' },
					headers: { Authorization: 'Bearer token' },
				}),
			);
		});

		test('should encode the url before requesting it', async () => {
			await request('https://allowed.example/path with spaces');

			expect(mockAxios).toHaveBeenCalledWith(
				expect.objectContaining({ url: 'https://allowed.example/path%20with%20spaces' }),
			);
		});
	});

	describe('response', () => {
		test('should return only the status, status text, headers and data', async () => {
			mockAxios.mockResolvedValue({ ...response, config: {}, request: {} });

			await expect(request('https://allowed.example/path')).resolves.toEqual(response);
		});

		test('should reject when the request fails', async () => {
			mockAxios.mockRejectedValue(new Error('Request failed with status code 500'));

			await expect(request('https://allowed.example/path')).rejects.toThrow('Request failed with status code 500');
		});
	});
});
