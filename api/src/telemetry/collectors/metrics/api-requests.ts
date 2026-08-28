import { useBufferedCounter } from '../../counter/use-buffered-counter.js';
import type { TelemetryReport } from '../../types/report.js';
import { TRACKED_KEYS } from '../../utils/api-request-keys.js';

type ApiRequestMetrics = TelemetryReport['metrics']['api_requests'];

export async function collectApiRequestMetrics(): Promise<ApiRequestMetrics> {
	const counter = useBufferedCounter('api-requests');

	// Keys only ever incremented by another process aren't in the local buckets, so they have to be
	// named explicitly to be read and reset.
	const raw = await counter.getAndResetAll([...TRACKED_KEYS]);

	const method = {
		get: { count: raw['get'] ?? 0 },
		search: { count: raw['search'] ?? 0 },
		post: { count: raw['post'] ?? 0 },
		put: { count: raw['put'] ?? 0 },
		patch: { count: raw['patch'] ?? 0 },
		delete: { count: raw['delete'] ?? 0 },
	};

	return {
		count: Object.values(method).reduce((total, { count }) => total + count, 0),
		cached: { count: raw['cached'] ?? 0 },
		method,
	};
}
