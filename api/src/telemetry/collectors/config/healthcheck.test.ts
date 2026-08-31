import { describe, expect, test } from 'vitest';
import { collectHealthcheck } from './healthcheck.js';

describe('collectHealthcheck', () => {
	test('defaults to false', () => {
		expect(collectHealthcheck({})).toStrictEqual({ enabled: false });
	});

	test('reads HEALTHCHECK_ENABLED', () => {
		expect(collectHealthcheck({ HEALTHCHECK_ENABLED: true })).toStrictEqual({ enabled: true });
	});
});
