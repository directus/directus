import type { Request } from 'express';
import { expect, test, vi } from 'vitest';
import { getEnv } from '../env.js';
import { shouldSkipCache } from './should-skip-cache.js';

vi.mock('../env');

test.each([
	{ scenario: 'not relative', publicURL: 'http://admin.example.com', refererHost: '' },
	{ scenario: 'relative', publicURL: '/', refererHost: 'http://ignore.domain' },
	{ scenario: 'relative with subdirectory', publicURL: '/test/subfolder', refererHost: 'http://ignore.domain' },
])(
	'should always skip cache for requests coming from data studio when public URL is $scenario and CACHE_AUTO_PURGE is false',
	({ publicURL, refererHost }) => {
		vi.mocked(getEnv).mockReturnValue({
			PUBLIC_URL: publicURL,
			CACHE_SKIP_ALLOWED: false,
			CACHE_AUTO_PURGE: false,
			CACHE_AUTO_PURGE_IGNORE_LIST: ['directus_activity', 'directus_presets'],
		});

		const req = {
			get: vi.fn((str) => {
				switch (str) {
					case 'Referer':
						return `${refererHost}${publicURL}/admin/settings/data-model`;
					default:
						return undefined;
				}
			}),
			originalUrl: 'http://admin.example.com/items/test',
		} as unknown as Request;

		expect(shouldSkipCache(req)).toBe(true);
	}
);

test.each([
	{ scenario: 'not relative', publicURL: 'http://admin.example.com', refererHost: '' },
	{ scenario: 'relative', publicURL: '/', refererHost: 'http://ignore.domain' },
	{ scenario: 'relative with subdirectory', publicURL: '/test/subfolder', refererHost: 'http://ignore.domain' },
])(
	'should not skip cache for requests coming from data studio when public URL is $scenario and CACHE_AUTO_PURGE is true',
	({ publicURL, refererHost }) => {
		vi.mocked(getEnv).mockReturnValue({
			PUBLIC_URL: publicURL,
			CACHE_SKIP_ALLOWED: false,
			CACHE_AUTO_PURGE: true,
			CACHE_AUTO_PURGE_IGNORE_LIST: ['directus_activity', 'directus_presets', 'ignore_collection'],
		});

		const req = {
			get: vi.fn((str) => {
				switch (str) {
					case 'Referer':
						return `${refererHost}${publicURL}/admin/settings/data-model`;
					default:
						return undefined;
				}
			}),
			originalUrl: 'http://admin.example.com/items/some_collection',
		} as unknown as Request;

		expect(shouldSkipCache(req)).toBe(false);
	}
);

test.each([
	{ scenario: 'not relative', publicURL: 'http://admin.example.com', refererHost: '' },
	{ scenario: 'relative', publicURL: '/', refererHost: 'http://ignore.domain' },
	{ scenario: 'relative with subdirectory', publicURL: '/test/subfolder', refererHost: 'http://ignore.domain' },
])(
	'should skip cache for requests with collections in CACHE_AUTO_PURGE_IGNORE_LIST coming from data studio when public URL is $scenario and CACHE_AUTO_PURGE is true',
	({ publicURL, refererHost }) => {
		vi.mocked(getEnv).mockReturnValue({
			PUBLIC_URL: publicURL,
			CACHE_SKIP_ALLOWED: false,
			CACHE_AUTO_PURGE: true,
			CACHE_AUTO_PURGE_IGNORE_LIST: ['directus_activity', 'directus_presets', 'ignore_collection'],
		});

		const req = {
			get: vi.fn((str) => {
				switch (str) {
					case 'Referer':
						return `${refererHost}${publicURL}/admin/settings/data-model`;
					default:
						return undefined;
				}
			}),
			originalUrl: 'http://admin.example.com/items/ignore_collection',
		} as unknown as Request;

		expect(shouldSkipCache(req)).toBe(true);
	}
);

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
