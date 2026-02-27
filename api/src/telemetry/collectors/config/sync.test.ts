import { describe, expect, test } from 'vitest';
import { collectSyncStore } from './sync.js';

describe('collectSyncStore', () => {
	test('defaults to null when not configured', () => {
		expect(collectSyncStore({})).toEqual({ store: null });
	});

	test('returns configured store', () => {
		expect(collectSyncStore({ SYNCHRONIZATION_STORE: 'redis' })).toEqual({ store: 'redis' });
	});
});
