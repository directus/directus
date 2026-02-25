export type TrackedMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export type ApiRequestInput = Partial<Record<TrackedMethod, number>>;

export type ApiRequestOutput = {
	[K in TrackedMethod as `api_requests_${K}`]?: number;
} & {
	api_requests: number;
};

export function formatApiRequestCounts(counts: ApiRequestInput): ApiRequestOutput {
	const formatted: Record<string, number> = {};
	let total = 0;

	for (const method in counts) {
		const count = counts[method as TrackedMethod]!;
		formatted[`api_requests_${method}`] = count;
		total += count;
	}

	formatted['api_requests'] = total;

	return formatted as ApiRequestOutput;
}
