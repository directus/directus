import type { DataDriver } from './types/driver.js';
import type { AbstractQuery } from './types/abstract-query.js';

export class DataManager {
	#stores: Map<string, DataDriver>;

	constructor() {
		this.#stores = new Map();
	}

	registerStore(name: string, driver: DataDriver) {
		this.#stores.set(name, driver);
	}

	store(name: string): DataDriver {
		const store = this.#stores.get(name);

		if (!store) {
			throw new Error(`Store "${name}" doesn't exist.`);
		}

		return store;
	}

	async query(query: AbstractQuery) {
		return this.store(query.datastore).query(query);
	}
}
