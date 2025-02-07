import { useEnv } from '@directus/env';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { useMetrics } from './use-metrics.js';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({}),
}));

afterEach(() => {
	vi.clearAllMocks();
});

describe('useMetrics', () => {
	test('Returns undefined when metrics is disabled', () => {
		vi.mocked(useEnv).mockReturnValue({ METRICS_ENABLED: false });

		const metrics = useMetrics();
		expect(metrics).toBeNull();
	});

	test('Returns defined when metrics is enabled', () => {
		vi.mocked(useEnv).mockReturnValue({ METRICS_ENABLED: true });
		const metrics = useMetrics();
		expect(metrics).not.toBeNull();
	});
});
