import type { DataDriver } from './types/driver.js';
import type { AbstractQuery } from './types/abstract-query.js';

export class DataEngine {
	#stores: Map<string, DataDriver>;

	constructor() {
		this.#stores = new Map();
	}

	/** Registers a new data store for use in queries */
	registerStore(name: string, driver: DataDriver) {
		this.#stores.set(name, driver);
	}

	/** Access the driver of a given store. Errors if it hasn't been registered */
	store(name: string): DataDriver {
		const store = this.#stores.get(name);

		if (!store) {
			throw new Error(`Store "${name}" doesn't exist.`);
		}

		return store;
	}

	/** Execute a root abstract query */
	async query(query: AbstractQuery): Promise<NodeJS.ReadableStream> {
		return this.store(query.store).query(query);
	}
}
