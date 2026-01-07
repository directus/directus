import { useEnv } from '@directus/env';
import { toBoolean } from '@directus/utils';
import { createMetrics } from './create-metrics.js';

export const _cache: {
	metrics: ReturnType<typeof createMetrics> | undefined;
} = { metrics: undefined };

export const useMetrics = () => {
	const env = useEnv();

	if (!toBoolean(env['METRICS_ENABLED'])) {
		return;
	}

	if (_cache.metrics) {
		return _cache.metrics;
	}

	_cache.metrics = createMetrics();

	return _cache.metrics;
};
