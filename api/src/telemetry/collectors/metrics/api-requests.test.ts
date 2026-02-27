import { afterEach, describe, expect, test, vi } from 'vitest';
import { collectApiRequestMetrics } from './api-requests.js';

vi.mock('../../counter/use-buffered-counter.js', () => ({
	useBufferedCounter: vi.fn().mockReturnValue({
		getAndResetAll: vi.fn().mockResolvedValue({}),
	}),
}));

import { useBufferedCounter } from '../../counter/use-buffered-counter.js';

afterEach(() => {
	vi.clearAllMocks();
});

describe('collectApiRequestMetrics', () => {
	test('returns zeroes when no requests recorded', async () => {
		const result = await collectApiRequestMetrics();

		expect(result.count).toBe(0);
		expect(result.cached.count).toBe(0);
		expect(result.method.get.count).toBe(0);
		expect(result.method.post.count).toBe(0);
		expect(result.method.put.count).toBe(0);
		expect(result.method.patch.count).toBe(0);
		expect(result.method.delete.count).toBe(0);
	});

	test('sums all methods into count', async () => {
		vi.mocked(useBufferedCounter).mockReturnValue({
			getAndResetAll: vi.fn().mockResolvedValue({
				get: 10,
				post: 5,
				put: 2,
				patch: 3,
				delete: 1,
				cached: 4,
			}),
		} as any);

		const result = await collectApiRequestMetrics();

		expect(result.count).toBe(21);
		expect(result.cached.count).toBe(4);
		expect(result.method.get.count).toBe(10);
		expect(result.method.post.count).toBe(5);
		expect(result.method.put.count).toBe(2);
		expect(result.method.patch.count).toBe(3);
		expect(result.method.delete.count).toBe(1);
	});

	test('handles partial methods', async () => {
		vi.mocked(useBufferedCounter).mockReturnValue({
			getAndResetAll: vi.fn().mockResolvedValue({ get: 7 }),
		} as any);

		const result = await collectApiRequestMetrics();
		expect(result.count).toBe(7);
		expect(result.method.post.count).toBe(0);
	});
});
