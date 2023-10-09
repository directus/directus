import type { ReadableStream } from 'node:stream/web';

import type { AbstractQuery } from './abstract-query.js';

export abstract class DataDriver {
	abstract query: (query: AbstractQuery) => Promise<ReadableStream>;

	/**
	 * When the driver is first registered. Can be used to warm up caches, prepare connections to
	 * databases, login to external services, etc
	 */
	register?: () => Promise<void>;

	/**
	 * Fires when the driver is no longer needed. Can be used to disconnect databases, logout from
	 * services, etc
	 */
	destroy?: () => Promise<void>;
}
