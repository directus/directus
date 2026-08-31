import { describe, expect, test } from 'vitest';
import { collectRedis } from './redis.js';

describe('collectRedis', () => {
	test('defaults to false', () => {
		expect(collectRedis({})).toStrictEqual({ enabled: false });
	});

	test('reads REDIS_ENABLED', () => {
		expect(collectRedis({ REDIS_ENABLED: true })).toStrictEqual({ enabled: true });
	});
});
