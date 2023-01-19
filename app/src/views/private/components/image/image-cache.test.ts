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

import { useImageCacheStore } from './image-cache';

describe('getModuleBarLogo getter', async () => {
	test('should retrieve undefined when not cached', async () => {
		const cacheStore = useImageCacheStore();

		expect(cacheStore.getModuleBarLogo()).toBeUndefined();
	});

	test('should retrieve the cached image', async () => {
		const cacheStore = useImageCacheStore();
		const cacheValue = 'abc';

		cacheStore.moduleBarLogo = cacheValue;

		expect(cacheStore.getModuleBarLogo()).toEqual(cacheValue);
	});
});

describe('getModuleBarAvatar getter', async () => {
	test('should retrieve undefined when not cached', async () => {
		const cacheStore = useImageCacheStore();

		expect(cacheStore.getModuleBarAvatar()).toBeUndefined();
	});

	test('should retrieve the cached image', async () => {
		const cacheStore = useImageCacheStore();
		const cacheValue = 'def';

		cacheStore.moduleBarAvatar = cacheValue;

		expect(cacheStore.getModuleBarAvatar()).toEqual(cacheValue);
	});
});

describe('cacheModuleBarLogo action', async () => {
	test('should cache the image', async () => {
		const cacheStore = useImageCacheStore();
		const cacheValue = 'ghi';

		await cacheStore.cacheModuleBarLogo(cacheValue);

		expect(cacheStore.moduleBarLogo).toEqual(cacheValue);
	});

	test('should override the existing cache', async () => {
		const cacheStore = useImageCacheStore();
		const cacheValue = 'jkl';

		cacheStore.moduleBarLogo = 'mno';
		await cacheStore.cacheModuleBarLogo(cacheValue);

		expect(cacheStore.moduleBarLogo).toEqual(cacheValue);
	});
});

describe('cacheModuleBarAvatar action', async () => {
	test('should cache the image', async () => {
		const cacheStore = useImageCacheStore();
		const cacheValue = 'pqr';

		await cacheStore.cacheModuleBarAvatar(cacheValue);

		expect(cacheStore.moduleBarAvatar).toEqual(cacheValue);
	});

	test('should override the existing cache', async () => {
		const cacheStore = useImageCacheStore();
		const cacheValue = 'stu';

		cacheStore.moduleBarAvatar = 'vwx';
		await cacheStore.cacheModuleBarAvatar(cacheValue);

		expect(cacheStore.moduleBarAvatar).toEqual(cacheValue);
	});
});
