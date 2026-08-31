import { describe, expect, test } from 'vitest';
import { collectOpenapi } from './openapi.js';

describe('collectOpenapi', () => {
	test('defaults to false', () => {
		expect(collectOpenapi({})).toStrictEqual({ enabled: false });
	});

	test('reads OPENAPI_ENABLED', () => {
		expect(collectOpenapi({ OPENAPI_ENABLED: true })).toStrictEqual({ enabled: true });
	});
});
