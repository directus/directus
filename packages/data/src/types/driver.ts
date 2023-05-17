import type { AbstractQuery } from './abstract-query.js';

export abstract class DataDriver {
	abstract connect: () => Promise<void>;
	abstract disconnect: () => Promise<void>;

	abstract query: (query: AbstractQuery) => Promise<NodeJS.ReadableStream>;
}
