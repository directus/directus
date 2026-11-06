import { afterEach, describe, expect, test, vi } from 'vitest';
import { useBufferedCounter } from '../../counter/use-buffered-counter.js';
import { TRACKED_KEYS } from '../../utils/api-request-keys.js';
import { collectApiRequestMetrics } from './api-requests.js';

const getAndResetAll = vi.fn().mockResolvedValue({});

vi.mock('../../counter/use-buffered-counter.js', () => ({
	useBufferedCounter: vi.fn(),
}));

afterEach(() => {
	vi.clearAllMocks();
});

const mockCounts = (counts: Record<string, number>) => {
	getAndResetAll.mockResolvedValue(counts);
	vi.mocked(useBufferedCounter).mockReturnValue({ getAndResetAll } as any);
};

describe('collectApiRequestMetrics', () => {
	test('returns zeroes when no requests recorded', async () => {
		mockCounts({});

		const result = await collectApiRequestMetrics();

		expect(result.count).toBe(0);
		expect(result.cached.count).toBe(0);
		expect(result.method.get.count).toBe(0);
		expect(result.method.search.count).toBe(0);
		expect(result.method.post.count).toBe(0);
		expect(result.method.put.count).toBe(0);
		expect(result.method.patch.count).toBe(0);
		expect(result.method.delete.count).toBe(0);
	});

	test('sums all methods into count', async () => {
		mockCounts({ get: 10, search: 6, post: 5, put: 2, patch: 3, delete: 1, cached: 4 });

		const result = await collectApiRequestMetrics();

		expect(result.count).toBe(27);
		expect(result.cached.count).toBe(4);
		expect(result.method.get.count).toBe(10);
		expect(result.method.search.count).toBe(6);
		expect(result.method.post.count).toBe(5);
		expect(result.method.put.count).toBe(2);
		expect(result.method.patch.count).toBe(3);
		expect(result.method.delete.count).toBe(1);
	});

	test('excludes cached hits from the total', async () => {
		mockCounts({ get: 10, cached: 4 });

		const result = await collectApiRequestMetrics();

		expect(result.count).toBe(10);
		expect(result.cached.count).toBe(4);
	});

	test('handles partial methods', async () => {
		mockCounts({ get: 7 });

		const result = await collectApiRequestMetrics();

		expect(result.count).toBe(7);
		expect(result.method.post.count).toBe(0);
	});

	test('asks for every tracked key so counts from other processes are read and reset too', async () => {
		mockCounts({});

		await collectApiRequestMetrics();

		expect(getAndResetAll).toHaveBeenCalledWith([...TRACKED_KEYS]);
	});
});
