export interface RateLimitedClient<_Schema extends object> {
	getQueueSize: () => number;
}

export type RateLimiterConfig = {
	concurrency: number;
	timeout: number;
	interval: number;
	intervalLimit: number;
};
