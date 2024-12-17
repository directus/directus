import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createMetrics } from './create-metrics.js';
import { _cache, useMetrics } from './use-metrics.js';

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
	test('Returns cached metrics if it exists', () => {
		_cache.metrics = mockMetrics;
		const metrics = useMetrics();
		expect(metrics).toBe(mockMetrics);
	});

	test('Creates new metrics instance', () => {
		const metrics = useMetrics();
		expect(metrics).toBe(mockMetrics);
	});
});
