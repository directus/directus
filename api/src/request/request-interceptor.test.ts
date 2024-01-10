import { randIp, randUrl, randWord } from '@ngneat/falso';
import type { InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
import type { LookupAddress } from 'node:dns';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { URL } from 'node:url';
import type { Logger } from 'pino';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useLogger } from '../logger.js';
import { requestInterceptor } from './request-interceptor.js';
import { validateIP } from './validate-ip.js';

vi.mock('axios');
vi.mock('node:net');
vi.mock('node:url');
vi.mock('node:dns/promises');
vi.mock('./validate-ip');
vi.mock('../logger');

let sample: {
	config: InternalAxiosRequestConfig;
	url: string;
	hostname: string;
	ip: string;
};

let mockLogger: Logger<never>;

beforeEach(() => {
	sample = {
		config: {} as InternalAxiosRequestConfig,
		url: randUrl(),
		hostname: randWord(),
		ip: randIp(),
	};

	mockLogger = {
		warn: vi.fn(),
	} as unknown as Logger<never>;

	vi.mocked(axios.getUri).mockReturnValue(sample.url);
	vi.mocked(URL).mockReturnValue({ hostname: sample.hostname } as URL);
	vi.mocked(lookup).mockResolvedValue({ address: sample.ip } as LookupAddress);
	vi.mocked(isIP).mockReturnValue(0);
	vi.mocked(useLogger).mockReturnValue(mockLogger);
});

afterEach(() => {
	vi.resetAllMocks();
});

test('Uses axios getUri to get full URI', async () => {
	await requestInterceptor(sample.config);
	expect(axios.getUri).toHaveBeenCalledWith(sample.config);
});

test('Gets hostname using URL', async () => {
	await requestInterceptor(sample.config);
	expect(URL).toHaveBeenCalledWith(sample.url);
});

test('Checks if hostname is IP', async () => {
	await requestInterceptor(sample.config);
	expect(isIP).toHaveBeenCalledWith(sample.hostname);
});

test('Looks up IP address using dns lookup if hostname is not an IP address', async () => {
	await requestInterceptor(sample.config);
	expect(lookup).toHaveBeenCalledWith(sample.hostname);
});

test('Logs when the lookup throws an error', async () => {
	const mockError = new Error();
	vi.mocked(lookup).mockRejectedValue(mockError);

	try {
		await requestInterceptor(sample.config);
	} catch {
		// Expect to error
	} finally {
		expect(mockLogger.warn).toHaveBeenCalledWith(mockError, `Couldn't lookup the DNS for url "${sample.url}"`);
	}
});

test('Throws error when dns lookup fails', async () => {
	const mockError = new Error();
	vi.mocked(lookup).mockRejectedValue(mockError);

	try {
		await requestInterceptor(sample.config);
	} catch (err: any) {
		expect(err).toBeInstanceOf(Error);
		expect(err.message).toBe(`Requested URL "${sample.url}" resolves to a denied IP address`);
	}
});

test('Validates IP', async () => {
	await requestInterceptor(sample.config);
	expect(validateIP).toHaveBeenCalledWith(sample.ip, sample.url);
});

test('Validates IP from hostname if URL hostname is IP', async () => {
	vi.mocked(isIP).mockReturnValue(4);
	await requestInterceptor(sample.config);
	expect(validateIP).toHaveBeenCalledWith(sample.hostname, sample.url);
});

test('Returns config unmodified', async () => {
	const config = await requestInterceptor(sample.config);
	expect(config).toBe(config);
});
