import type { IncomingMessage } from 'http';
import { useEnv } from '@directus/env';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { getIPFromReq } from './get-ip-from-req.js';

const warn = vi.fn();

vi.mock('@directus/env');

vi.mock('../logger/index.js', () => ({
	useLogger: vi.fn(() => ({ warn })),
}));

afterEach(() => {
	vi.clearAllMocks();
});

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

	describe('Custom IP header warning', () => {
		test('Warns when custom header does not return a valid IP', () => {
			vi.mocked(useEnv).mockReturnValue({
				IP_TRUST_PROXY: true,
				IP_CUSTOM_HEADER: 'X-CUSTOM-IP',
			});

			getIPFromReq({
				socket: { remoteAddress: '127.0.0.1' },
				headers: {},
				url: '/items/articles',
			} as unknown as IncomingMessage);

			expect(warn).toHaveBeenCalledOnce();
		});

		test('Does not warn when the custom header returns a valid IP', () => {
			vi.mocked(useEnv).mockReturnValue({
				IP_TRUST_PROXY: true,
				IP_CUSTOM_HEADER: 'X-CUSTOM-IP',
			});

			getIPFromReq({
				socket: { remoteAddress: '127.0.0.1' },
				headers: { 'x-custom-ip': '127.0.0.2' },
			} as unknown as IncomingMessage);

			expect(warn).not.toHaveBeenCalled();
		});

		test.each(['/server/ping', '/server/info'])('Suppresses the warning on the no-auth endpoint %s', (path) => {
			vi.mocked(useEnv).mockReturnValue({
				IP_TRUST_PROXY: true,
				IP_CUSTOM_HEADER: 'X-CUSTOM-IP',
			});

			const result = getIPFromReq({
				socket: { remoteAddress: '127.0.0.1' },
				headers: {},
				originalUrl: path,
			} as unknown as IncomingMessage);

			expect(warn).not.toHaveBeenCalled();
			// Falls back to the resolved socket IP
			expect(result).toBe('127.0.0.1');
		});

		test('Suppresses the warning on excluded endpoints even with a query string', () => {
			vi.mocked(useEnv).mockReturnValue({
				IP_TRUST_PROXY: true,
				IP_CUSTOM_HEADER: 'X-CUSTOM-IP',
			});

			getIPFromReq({
				socket: { remoteAddress: '127.0.0.1' },
				headers: {},
				url: '/server/info?foo=bar',
			} as unknown as IncomingMessage);

			expect(warn).not.toHaveBeenCalled();
		});

		test('Suppresses the warning regardless of path casing', () => {
			vi.mocked(useEnv).mockReturnValue({
				IP_TRUST_PROXY: true,
				IP_CUSTOM_HEADER: 'X-CUSTOM-IP',
			});

			getIPFromReq({
				socket: { remoteAddress: '127.0.0.1' },
				headers: {},
				url: '/server/PING',
			} as unknown as IncomingMessage);

			expect(warn).not.toHaveBeenCalled();
		});

		test('Does not throw and still warns on a malformed request target', () => {
			vi.mocked(useEnv).mockReturnValue({
				IP_TRUST_PROXY: true,
				IP_CUSTOM_HEADER: 'X-CUSTOM-IP',
			});

			getIPFromReq({
				socket: { remoteAddress: '127.0.0.1' },
				headers: {},
				url: '//bad url',
			} as unknown as IncomingMessage);

			expect(warn).toHaveBeenCalledOnce();
		});

		test('Still warns on other /server endpoints', () => {
			vi.mocked(useEnv).mockReturnValue({
				IP_TRUST_PROXY: true,
				IP_CUSTOM_HEADER: 'X-CUSTOM-IP',
			});

			getIPFromReq({
				socket: { remoteAddress: '127.0.0.1' },
				headers: {},
				url: '/server/health',
			} as unknown as IncomingMessage);

			expect(warn).toHaveBeenCalledOnce();
		});
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
