import { useEnv } from '@directus/env';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createMetrics } from './create-metrics.js';
import { _cache, useMetrics } from './use-metrics.js';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({}),
}));

vi.mock('./create-metrics.js');

let mockMetrics: ReturnType<typeof createMetrics>;

beforeEach(() => {
	mockMetrics = {} as unknown as ReturnType<typeof createMetrics>;
	vi.mocked(createMetrics).mockReturnValue(mockMetrics);
});

afterEach(() => {
	_cache.metrics = undefined;
});

describe('useMetrics', () => {
	test('Returns undefined when metrics are disabled', () => {
		vi.mocked(useEnv).mockReturnValue({ METRICS_ENABLED: false });

		const metrics = useMetrics();
		expect(metrics).toBeUndefined();
	});

	test('Returns cached metrics if it exists', () => {
		vi.mocked(useEnv).mockReturnValue({ METRICS_ENABLED: true });
		_cache.metrics = mockMetrics;

		const metrics = useMetrics();
		expect(metrics).toBe(mockMetrics);
	});

	test('Creates new metrics instance', () => {
		vi.mocked(useEnv).mockReturnValue({ METRICS_ENABLED: true });

		const metrics = useMetrics();
		expect(metrics).toBe(mockMetrics);
	});
});
