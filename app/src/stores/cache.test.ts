import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		})
	);
});

import { useCacheStore } from './cache';

describe('getImage getter', async () => {
	test('should retrieve the cached image', async () => {
		const cacheStore = useCacheStore();

		const cacheKey = 'abc';
		const cacheValue = '123';
		cacheStore.images = {
			[cacheKey]: cacheValue,
		};

		expect(cacheStore.getImage(cacheKey)).toEqual(cacheValue);
	});
});

describe('cacheImage action', async () => {
	test('should cache the image', async () => {
		const cacheStore = useCacheStore();

		const cacheKey = 'def';
		const cacheValue = '456';

		await cacheStore.cacheImage(cacheKey, cacheValue);

		expect(cacheStore.images[cacheKey]).toEqual(cacheValue);
	});
});
