import { useEnv } from '@directus/env';
import { beforeEach, expect, test, vi } from 'vitest';
import { useLogger } from '../../logger/index.js';
import { getStorageMaxConcurrency } from './get-storage-max-concurrency.js';

vi.mock('@directus/env');
vi.mock('../../logger/index.js');

let mockLogger: any;

beforeEach(() => {
	vi.clearAllMocks();
	mockLogger = { warn: vi.fn() };
	vi.mocked(useLogger).mockReturnValue(mockLogger);
});

test('should return the configured value', () => {
	vi.mocked(useEnv).mockReturnValue({ EXTENSIONS_STORAGE_MAX_CONCURRENCY: 50 });

	expect(getStorageMaxConcurrency()).toBe(50);
	expect(mockLogger.warn).not.toHaveBeenCalled();
});

test('should accept a numeric string', () => {
	vi.mocked(useEnv).mockReturnValue({ EXTENSIONS_STORAGE_MAX_CONCURRENCY: '5' });

	expect(getStorageMaxConcurrency()).toBe(5);
});

test.each([
	['non-numeric string', 'abc'],
	['zero', 0],
	['negative', -1],
	['decimal', 2.5],
	['Infinity', Infinity],
	['undefined', undefined],
])('should fall back to the default and warn for %s', (_label, value) => {
	vi.mocked(useEnv).mockReturnValue({ EXTENSIONS_STORAGE_MAX_CONCURRENCY: value } as any);

	expect(getStorageMaxConcurrency()).toBe(20);
	expect(mockLogger.warn).toHaveBeenCalled();
});
