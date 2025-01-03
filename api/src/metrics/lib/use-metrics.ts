import { createMetrics } from './create-metrics.js';

export const _cache: {
	metrics: ReturnType<typeof createMetrics> | undefined;
} = { metrics: undefined };

export const useMetrics = () => {
	if (_cache.metrics) {
		return _cache.metrics;
	}

	_cache.metrics = createMetrics();

	return _cache.metrics;
};
