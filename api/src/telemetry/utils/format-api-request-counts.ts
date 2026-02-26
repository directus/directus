export type TrackedMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';
export type TrackedKey = TrackedMethod | 'cached';

export const TRACKED_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;
export const TRACKED_KEYS = [...TRACKED_METHODS, 'cached'] as const;

export type ApiRequestInput = Partial<Record<TrackedKey, number>>;

export type ApiRequestOutput = {
	[K in TrackedKey as `api_requests_${K}`]?: number;
} & {
	api_requests: number;
};

export function formatApiRequestCounts(counts: ApiRequestInput): ApiRequestOutput {
	const formatted: Record<string, number> = {};
	let total = 0;

	for (const key of TRACKED_KEYS) {
		const count = counts[key] ?? 0;

		if (!(key in counts)) continue;

		formatted[`api_requests_${key}`] = count;

		if (key !== 'cached') {
			total += count;
		}
	}

	formatted['api_requests'] = total;

	return formatted as ApiRequestOutput;
}
