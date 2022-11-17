import { expect, test, afterEach, vi } from 'vitest';
import axios from 'axios';
import { getEnv } from '../env';
import { getProxyOptions } from './get-proxy-options';
import { sendRequest } from './send-request';
import type { RequestConfig } from '../types';
import type { AxiosRequestConfig } from 'axios';

vi.mock('axios');
vi.mock('../env');
vi.mock('./get-proxy-options');

afterEach(() => {
	vi.clearAllMocks();
});

test('Calls axios with the expected input', async () => {
	vi.mocked(getEnv).mockReturnValueOnce({});
	vi.mocked(axios.request).mockResolvedValue({});

	await sendRequest({ method: 'POST', url: 'localhost:1234', data: { status: 'active' } });

	expect(axios.request).toHaveBeenCalledWith({
		url: 'localhost:1234',
		method: 'POST',
		data: { status: 'active' },
		headers: {},
		proxy: undefined,
		timeout: undefined,
		maxRedirects: undefined,
	});
});

test('Defaults to environment variables for timeout/redirects', async () => {
	vi.mocked(getEnv).mockReturnValueOnce({
		REQUEST_TIMEOUT: 1500,
		REQUEST_MAX_REDIRECTS: 2,
	});
	vi.mocked(axios.request).mockResolvedValue({});

	await sendRequest({ method: 'POST', url: 'localhost:1234', data: { status: 'active' } });

	expect(axios.request).toHaveBeenCalledWith({
		url: 'localhost:1234',
		method: 'POST',
		data: { status: 'active' },
		headers: {},
		proxy: undefined,
		timeout: 1500,
		maxRedirects: 2,
	});
});

test('Allows setting timeout/max-redirects through options', async () => {
	vi.mocked(getEnv).mockReturnValueOnce({
		REQUEST_TIMEOUT: 1000,
		REQUEST_MAX_REDIRECTS: 1,
	});
	vi.mocked(axios.request).mockResolvedValue({});

	await sendRequest({
		method: 'POST',
		url: 'localhost:1234',
		data: { status: 'active' },
		options: { maxRedirects: 2, timeout: 1500 },
	});

	expect(axios.request).toHaveBeenCalledWith({
		url: 'localhost:1234',
		method: 'POST',
		data: { status: 'active' },
		headers: {},
		proxy: undefined,
		timeout: 1500,
		maxRedirects: 2,
	});
});

test('Passes proxy options from getProxyOptions', async () => {
	vi.mocked(getProxyOptions).mockReturnValueOnce({ host: 'localhost', port: 1234, protocol: 'http' });
	vi.mocked(getEnv).mockReturnValueOnce({
		REQUEST_TIMEOUT: 1000,
		REQUEST_MAX_REDIRECTS: 1,
	});
	vi.mocked(axios.request).mockResolvedValue({});

	await sendRequest({
		method: 'POST',
		url: 'localhost:1234',
		data: { status: 'active' },
		options: { maxRedirects: 2, timeout: 1500 },
	});

	expect(axios.request).toHaveBeenCalledWith({
		url: 'localhost:1234',
		method: 'POST',
		data: { status: 'active' },
		headers: {},
		proxy: { host: 'localhost', port: 1234, protocol: 'http' },
		timeout: 1500,
		maxRedirects: 2,
	});
});

test('Returns axios result', async () => {
	vi.mocked(getEnv).mockReturnValueOnce({});
	vi.mocked(axios.request).mockResolvedValue({
		status: 200,
		data: {
			test: true,
		},
		statusText: 'OK',
		headers: {
			'X-Status': 'OK',
		},
	});

	const result = await sendRequest({ method: 'POST', url: 'localhost:1234', data: { status: 'active' } });

	expect(result).toStrictEqual({
		status: 200,
		data: {
			test: true,
		},
		statusText: 'OK',
		headers: {
			'X-Status': 'OK',
		},
	});
});
