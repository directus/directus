import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { Reference } from 'isolated-vm';
import { beforeEach, expect, test, vi } from 'vitest';
import { getAxios } from '../../../../../request/index.js';
import { requestGenerator } from './request.js';

vi.mock('../../../../../request/index.js', () => ({ getAxios: vi.fn() }));

const request = vi.fn();

beforeEach(() => {
	vi.clearAllMocks();
	request.mockResolvedValue({ status: 200, statusText: 'OK', headers: {}, data: '' });
	vi.mocked(getAxios).mockResolvedValue(request as unknown as AxiosInstance);
});

function urlReference(url: string): Reference<string> {
	return {
		typeof: 'string',
		copy: vi.fn().mockResolvedValue(url),
	} as unknown as Reference<string>;
}

const undefinedReference = { typeof: 'undefined' } as Reference<Record<string, never>>;

async function makeRequest(url: string, allowedUrlScope = 'https://allowed.example/**') {
	return requestGenerator({
		request: { methods: ['GET'], urls: [allowedUrlScope] },
	})(urlReference(url), undefinedReference);
}

function redirectGuard() {
	const config = request.mock.calls[0]?.[0] as InternalAxiosRequestConfig;
	expect(config.beforeRedirect).toBeTypeOf('function');
	return config.beforeRedirect!;
}

test('rejects an initial URL outside the sandbox request scope', async () => {
	await expect(makeRequest('https://blocked.example/path')).rejects.toThrow(
		'No permission to request "https://blocked.example/path"',
	);

	expect(request).not.toHaveBeenCalled();
});

test('allows a redirect that remains within the sandbox request scope', async () => {
	await makeRequest('https://allowed.example/start');

	expect(() =>
		redirectGuard()({ protocol: 'https:', hostname: 'allowed.example', path: '/next' }, {} as never),
	).not.toThrow();
});

test('rejects a redirect that leaves the sandbox request scope before it is requested', async () => {
	await makeRequest('https://allowed.example/start');

	expect(() => redirectGuard()({ protocol: 'https:', hostname: 'blocked.example', path: '/next' }, {} as never)).toThrow(
		'No permission to request "https://blocked.example/next"',
	);
});

test('rejects a redirect with an incomplete destination before it is requested', async () => {
	await makeRequest('https://allowed.example/start');

	expect(() => redirectGuard()({ hostname: 'blocked.example', path: '/next' }, {} as never)).toThrow(
		'Unable to validate redirect URL',
	);
});
