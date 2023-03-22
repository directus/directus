import type { Request } from 'express';
import { expect, test, vi } from 'vitest';
import { getEnv } from '../env';
import { shouldSkipCache } from './should-skip-cache';

vi.mock('../env');

test('should always skip cache for requests coming from data studio', () => {
	const publicURL = 'http://admin.example.com';

	vi.mocked(getEnv).mockReturnValue({ PUBLIC_URL: publicURL, CACHE_SKIP_ALLOWED: false });

	const req = {
		get: vi.fn((str) => {
			switch (str) {
				case 'Referer':
					return `${publicURL}/admin/settings/data-model`;
				default:
					return undefined;
			}
		}),
	} as unknown as Request;

	expect(shouldSkipCache(req)).toBe(true);
});

test('should not skip cache for requests coming outside of data studio', () => {
	vi.mocked(getEnv).mockReturnValue({ PUBLIC_URL: 'http://admin.example.com', CACHE_SKIP_ALLOWED: false });

	const req = {
		get: vi.fn((str) => {
			switch (str) {
				case 'Referer':
					return `http://elsewhere.example.com/admin/settings/data-model`;
				default:
					return undefined;
			}
		}),
	} as unknown as Request;

	expect(shouldSkipCache(req)).toBe(false);
});

test.each([
	{ scenario: 'accept', value: true },
	{ scenario: 'ignore', value: false },
])(
	'should $scenario Cache-Control request header containing "no-store" when CACHE_SKIP_ALLOWED is $value',
	({ value }) => {
		vi.mocked(getEnv).mockReturnValue({ PUBLIC_URL: '/', CACHE_SKIP_ALLOWED: value });

		const req = {
			get: vi.fn((str) => {
				switch (str) {
					case 'cache-control':
						return 'no-store';
					default:
						return undefined;
				}
			}),
		} as unknown as Request;

		expect(shouldSkipCache(req)).toBe(value);
	}
);
