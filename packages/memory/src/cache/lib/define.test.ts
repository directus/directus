import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createCache } from './create.js';
import { defineCache } from './define.js';

vi.mock('./create.js');

beforeEach(() => {
	vi.clearAllMocks();
});

describe('defineCache', () => {
	test('returns a use function', () => {
		const useCache = defineCache({ type: 'local' });
		expect(typeof useCache).toBe('function');
	});

	test('creates cache on first call', () => {
		const mockCache = { get: vi.fn() };
		vi.mocked(createCache).mockReturnValue(mockCache as any);

		const config = { type: 'local' } as const;
		const useCache = defineCache(config);

		const cache = useCache();

		expect(createCache).toHaveBeenCalledTimes(1);
		expect(createCache).toHaveBeenCalledWith(config);
		expect(cache).toBe(mockCache);
	});

	test('returns same instance on subsequent calls', () => {
		const mockCache = { get: vi.fn() };
		vi.mocked(createCache).mockReturnValue(mockCache as any);

		const useCache = defineCache({ type: 'local' });

		const cache1 = useCache();
		const cache2 = useCache();

		expect(createCache).toHaveBeenCalledTimes(1);
		expect(cache1).toBe(cache2);
	});
});
