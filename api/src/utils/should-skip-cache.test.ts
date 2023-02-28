import { Request } from 'express';
import { expect, test, vi } from 'vitest';
import { getEnv } from '../env';
import { shouldSkipCache } from './should-skip-cache';

vi.mock('../env');

test.each([
	{ scenario: 'accept', value: true },
	{ scenario: 'ignore', value: false },
])(
	'should $scenario Cache-Control request header containing "no-store" when CACHE_SKIP_ALLOWED is $value',
	({ value }) => {
		vi.mocked(getEnv).mockReturnValue({ CACHE_SKIP_ALLOWED: value });

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
