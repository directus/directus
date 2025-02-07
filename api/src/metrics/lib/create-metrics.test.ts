import { useEnv } from '@directus/env';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createMetrics } from './create-metrics.js';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({}),
}));

afterEach(() => {
	vi.clearAllMocks();
});

describe('createMetrics', () => {
	test('Returns null when metrics are disabled', () => {
		vi.mocked(useEnv).mockReturnValue({ METRICS_ENABLED: false });

		const metrics = createMetrics();
		expect(metrics).toBeNull();
	});

	test('Returns the metrics object when metrics are enabled', () => {
		vi.mocked(useEnv).mockReturnValue({ METRICS_ENABLED: true });
		const metrics = createMetrics();
		expect(metrics).not.toBeNull();
	});
});
