import { getIPFromReq } from './get-ip-from-req.js';
import { useEnv } from '@directus/env';
import type { IncomingMessage } from 'http';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@directus/env');

describe('getIPFromReq', () => {
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

	describe('IP_TRUST_PROXY', () => {
		test('Returns remoteAddress when false', () => {
			vi.mocked(useEnv).mockReturnValue({
				IP_TRUST_PROXY: false,
			});

			const result = getIPFromReq({
				socket: { remoteAddress: '127.0.0.1' },
				headers: { 'x-forwarded-for': '127.0.0.1,127.0.0.2' },
			} as unknown as IncomingMessage);

			expect(result).toBe('127.0.0.1');
		});

		test('Returns left most x-forwarded-for value if true', () => {
			vi.mocked(useEnv).mockReturnValue({
				IP_TRUST_PROXY: true,
			});

			const result = getIPFromReq({
				socket: { remoteAddress: '127.0.0.1' },
				headers: { 'x-forwarded-for': '127.0.0.1,127.0.0.2,127.0.0.3' },
			} as unknown as IncomingMessage);

			expect(result).toBe('127.0.0.1');
		});

		test('Returns last trusted ip in the subnet if string value', () => {
			vi.mocked(useEnv).mockReturnValue({
				IP_TRUST_PROXY: '127.0.0.0/30',
			});

			const result = getIPFromReq({
				socket: { remoteAddress: '127.0.0.1' },
				headers: { 'x-forwarded-for': '127.0.0.1,128.0.0.3,128.0.0.4,127.0.0.2' },
			} as unknown as IncomingMessage);

			expect(result).toBe('128.0.0.4');
		});

		test('Returns next entry after last trusted ip in csv if csv string value', () => {
			vi.mocked(useEnv).mockReturnValue({
				IP_TRUST_PROXY: '127.0.0.1,128.1.0.3',
			});

			const result = getIPFromReq({
				socket: { remoteAddress: '127.0.0.1' },
				headers: { 'x-forwarded-for': '127.0.0.1,127.0.0.4,128.1.0.3' },
			} as unknown as IncomingMessage);

			expect(result).toBe('127.0.0.4');
		});

		test('Returns next entry after last trusted ip for array value', () => {
			vi.mocked(useEnv).mockReturnValue({
				IP_TRUST_PROXY: ['127.0.0.1', '127.0.0.4'],
			});

			const result = getIPFromReq({
				socket: { remoteAddress: '127.0.0.1' },
				headers: { 'x-forwarded-for': '127.0.0.1,127.0.0.2,127.0.0.2' },
			} as unknown as IncomingMessage);

			expect(result).toBe('127.0.0.2');
		});
	});
});
