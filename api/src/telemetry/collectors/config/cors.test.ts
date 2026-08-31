import { describe, expect, test } from 'vitest';
import { collectCors } from './cors.js';

describe('collectCors', () => {
	test('defaults to false', () => {
		expect(collectCors({})).toStrictEqual({ enabled: false });
	});

	test('reads CORS_ENABLED', () => {
		expect(collectCors({ CORS_ENABLED: true })).toStrictEqual({ enabled: true });
	});
});
