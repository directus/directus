import type { AbstractQuery, DataDriver } from '@directus/data/types';
import { Readable } from 'node:stream';
import { Pool } from 'pg';

export interface DataDriverPostgresConfig {
	connectionString: string;
}

export default class DataDriverPostgres implements DataDriver {
	#config: DataDriverPostgresConfig;
	#pool: Pool;

	constructor(config: DataDriverPostgresConfig) {
		this.#config = config;

		this.#pool = new Pool({
			connectionString: this.#config.connectionString,
		});
	}

	async connect() {
		await this.#pool.connect();
	}

	async disconnect() {
		await this.#pool.end();
	}

	async query(_query: AbstractQuery) {
		return new Readable();
	}
}
