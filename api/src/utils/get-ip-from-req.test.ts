import { useEnv } from '@directus/env';
import type { IncomingMessage } from 'http';
import { expect, test, vi } from 'vitest';
import { getIPFromReq } from './get-ip-from-req.js';

vi.mock('@directus/env');

test('Removes null if ip is undefined', () => {
	vi.mocked(useEnv).mockReturnValue({
		IP_TRUST_PROXY: true,
	});

	const result = getIPFromReq({
		socket: {},
		headers: {},
	} as IncomingMessage);

	expect(result).toBe(null);
});

test('Returns ip if provided', () => {
	vi.mocked(useEnv).mockReturnValue({
		IP_TRUST_PROXY: true,
	});

	const result = getIPFromReq({
		socket: { remoteAddress: '127.0.0.1' },
		headers: {},
	} as IncomingMessage);

	expect(result).toBe('127.0.0.1');
});

test('Returns remoteAddress ip if not trusted', () => {
	vi.mocked(useEnv).mockReturnValue({
		IP_TRUST_PROXY: false,
	});

	const result = getIPFromReq({
		socket: { remoteAddress: '127.0.0.1' },
		headers: { 'x-forwarded-for': '127.0.0.2' },
	} as unknown as IncomingMessage);

	expect(result).toBe('127.0.0.1');
});

test('Returns the proxied ip if trusted', () => {
	vi.mocked(useEnv).mockReturnValue({
		IP_TRUST_PROXY: true,
	});

	const result = getIPFromReq({
		socket: { remoteAddress: '127.0.0.1' },
		headers: { 'x-forwarded-for': '127.0.0.2' },
	} as unknown as IncomingMessage);

	expect(result).toBe('127.0.0.2');
});

test('Removes `::ffff:` prefix from IPV4 addressed in IPV6 format', () => {
	vi.mocked(useEnv).mockReturnValue({
		IP_TRUST_PROXY: true,
	});

	const result = getIPFromReq({
		socket: { remoteAddress: '::ffff:127.0.0.1' },
		headers: {},
	} as unknown as IncomingMessage);

	expect(result).toBe('127.0.0.1');
});

test('Returns overriden ip if IP_CUSTOM_HEADER is set with valid IP', () => {
	vi.mocked(useEnv).mockReturnValue({
		IP_TRUST_PROXY: true,
		IP_CUSTOM_HEADER: 'X-CUSTOM-IP',
	});

	const result = getIPFromReq({
		socket: { remoteAddress: '127.0.0.1' },
		headers: { 'x-custom-ip': '127.0.0.2' },
	} as unknown as IncomingMessage);

	expect(result).toBe('127.0.0.2');
});
