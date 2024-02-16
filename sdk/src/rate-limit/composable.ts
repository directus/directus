import type { DirectusClient } from '../types/client.js';
import type { RateLimitedClient, RateLimiterConfig } from './types.js';


/**
 * Creates a client with a built-in rate limiter.
 *
 * @returns A Directus rate limited client
 */
export const rateLimit = (config: Partial<RateLimiterConfig> = {}) => {
	return <Schema extends object>(client: DirectusClient<Schema>): RateLimitedClient<Schema> => {
		const queue: any[] = [];

		client.hooks.onRequest.push((req) => {
			// add to queue
			// wait for execution
			return req;
		});

		client.hooks.onResponse.push((res, _req) => {
			// mark finished and remove
			return res;
		});

		return {
			getQueueSize() {
				return queue.length ?? 0;
			},
		};
	};
};
