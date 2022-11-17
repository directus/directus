import { vi, test, expect, afterEach } from 'vitest';
import { getEnv } from '../env';
import { getProxyOptions } from './get-proxy-options';

vi.mock('../env');

test('Returns undefined when REQUEST_PROXY is falsey', () => {
	vi.mocked(getEnv).mockReturnValueOnce({});
	expect(getProxyOptions()).toBe(undefined);

	vi.mocked(getEnv).mockReturnValueOnce({
		REQUEST_PROXY_ENABLED: false,
	});
	expect(getProxyOptions()).toBe(undefined);

	vi.mocked(getEnv).mockReturnValueOnce({
		REQUEST_PROXY_ENABLED: '',
	});
	expect(getProxyOptions()).toBe(undefined);

	vi.mocked(getEnv).mockReturnValueOnce({
		REQUEST_PROXY_ENABLED: 0,
	});
	expect(getProxyOptions()).toBe(undefined);
});

test('Throws error when host configuration is missing', () => {
	vi.mocked(getEnv).mockReturnValueOnce({
		REQUEST_PROXY_ENABLED: true,
	});

	expect(getProxyOptions).toThrow(Error('REQUEST_PROXY_HOST is required'));
});

test('Throws error when port configuration is missing', () => {
	vi.mocked(getEnv).mockReturnValueOnce({
		REQUEST_PROXY_ENABLED: true,
		REQUEST_PROXY_HOST: 'localhost',
	});

	expect(getProxyOptions).toThrow(Error('REQUEST_PROXY_PORT is required'));
});

test('Throws error when username is set, but password is missing', () => {
	vi.mocked(getEnv).mockReturnValueOnce({
		REQUEST_PROXY_ENABLED: true,
		REQUEST_PROXY_HOST: 'localhost',
		REQUEST_PROXY_PORT: 1234,
		REQUEST_PROXY_USERNAME: 'test-user',
	});

	expect(getProxyOptions).toThrow(Error('REQUEST_PROXY_PASSWORD is required when using REQUEST_PROXY_USERNAME'));
});

test('Throws error when username is set, but password is missing', () => {
	vi.mocked(getEnv).mockReturnValueOnce({
		REQUEST_PROXY_ENABLED: true,
		REQUEST_PROXY_HOST: 'localhost',
		REQUEST_PROXY_PORT: 1234,
		REQUEST_PROXY_PASSWORD: 'test-password',
	});

	expect(getProxyOptions).toThrow(Error('REQUEST_PROXY_USERNAME is required when using REQUEST_PROXY_PASSWORD'));
});

test('Returns formatted configuration object', () => {
	vi.mocked(getEnv).mockReturnValueOnce({
		REQUEST_PROXY_ENABLED: true,
		REQUEST_PROXY_PROTOCOL: 'https',
		REQUEST_PROXY_HOST: 'localhost',
		REQUEST_PROXY_PORT: 1234,
	});

	expect(getProxyOptions()).toStrictEqual({
		protocol: 'https',
		host: 'localhost',
		port: 1234,
	});

	vi.mocked(getEnv).mockReturnValueOnce({
		REQUEST_PROXY_ENABLED: true,
		REQUEST_PROXY_HOST: 'localhost',
		REQUEST_PROXY_PORT: 1234,
		REQUEST_PROXY_USERNAME: 'test-user',
		REQUEST_PROXY_PASSWORD: 'test-password',
	});

	expect(getProxyOptions()).toStrictEqual({
		protocol: 'http',
		host: 'localhost',
		port: 1234,
		auth: {
			username: 'test-user',
			password: 'test-password',
		},
	});
});
