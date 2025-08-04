import { useEnv } from '@directus/env';
import type Keyv from 'keyv';
import type { MutationOptions } from '@directus/types';
import { afterEach, expect, test, vi } from 'vitest';
import { shouldClearCache } from './should-clear-cache.js';

vi.mock('@directus/env');

afterEach(() => {
	vi.clearAllMocks();
});

const mockedCache = {} as Keyv;
const mockedMutationOptions = {} as MutationOptions;

test('should return false when cache is not provided', () => {
	vi.mocked(useEnv).mockReturnValue({ CACHE_AUTO_PURGE: true });

	expect(shouldClearCache(null, mockedMutationOptions)).toBe(false);
});

test('should return true when cache is provided', () => {
	vi.mocked(useEnv).mockReturnValue({ CACHE_AUTO_PURGE: true });

	expect(shouldClearCache(mockedCache, mockedMutationOptions)).toBe(true);
});

test('should return false when CACHE_AUTO_PURGE is false', () => {
	vi.mocked(useEnv).mockReturnValue({ CACHE_AUTO_PURGE: false });

	expect(shouldClearCache(mockedCache, mockedMutationOptions)).toBe(false);
});

test('should return true when CACHE_AUTO_PURGE is true', () => {
	vi.mocked(useEnv).mockReturnValue({ CACHE_AUTO_PURGE: true });

	expect(shouldClearCache(mockedCache, mockedMutationOptions)).toBe(true);
});

test('should return false when MutationOptions.autoPurgeCache is false', () => {
	vi.mocked(useEnv).mockReturnValue({ CACHE_AUTO_PURGE: true });

	expect(shouldClearCache(mockedCache, { autoPurgeCache: false })).toBe(false);
});

test('should return true when MutationOptions.autoPurgeCache is not false', () => {
	vi.mocked(useEnv).mockReturnValue({ CACHE_AUTO_PURGE: true });

	expect(shouldClearCache(mockedCache, { autoPurgeCache: undefined })).toBe(true);
});

test('should return false when collection is provided and in ignore list', () => {
	vi.mocked(useEnv).mockReturnValue({ CACHE_AUTO_PURGE: true, CACHE_AUTO_PURGE_IGNORE_LIST: 'ignored' });

	expect(shouldClearCache(mockedCache, mockedMutationOptions, 'ignored')).toBe(false);
});

test('should return true when collection is provided and not in ignore list', () => {
	vi.mocked(useEnv).mockReturnValue({ CACHE_AUTO_PURGE: true, CACHE_AUTO_PURGE_IGNORE_LIST: 'ignored' });

	expect(shouldClearCache(mockedCache, mockedMutationOptions, 'not-ignored')).toBe(true);
});
