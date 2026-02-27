import { useBufferedCounter } from '../../counter/use-buffered-counter.js';
import type { TelemetryReport } from '../../types/report.js';

type ApiRequestMetrics = TelemetryReport['metrics']['api_requests'];

/**
 * Read buffered API request counters and reset them.
 * Returns structured counts by method + cached.
 */
export async function collectApiRequestMetrics(): Promise<ApiRequestMetrics> {
	const counter = useBufferedCounter('api-requests');
	const raw = await counter.getAndResetAll();

	const get = raw['get'] ?? 0;
	const post = raw['post'] ?? 0;
	const put = raw['put'] ?? 0;
	const patch = raw['patch'] ?? 0;
	const del = raw['delete'] ?? 0;
	const cached = raw['cached'] ?? 0;

	return {
		count: get + post + put + patch + del,
		cached: { count: cached },
		method: {
			get: { count: get },
			post: { count: post },
			put: { count: put },
			patch: { count: patch },
			delete: { count: del },
		},
	};
}
