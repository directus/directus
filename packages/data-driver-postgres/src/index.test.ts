import type { AbstractQuery } from '@directus/data/types';
import { test, expect } from 'vitest';
import DataDriverPostgres from './index.js';
import type { DataDriverPostgresConfig } from './index.js';

test('error when querying without connection before', async () => {
	const config: DataDriverPostgresConfig = {
		connectionString: 'postgres://user:password@:localhost:5432/dummy',
	};

	const driver = new DataDriverPostgres(config);

	const abstractQuery: AbstractQuery = {
		root: true,
		store: 'postgres',
		collection: 'articles',
		nodes: [
			{
				type: 'primitive',
				field: 'id',
			},
		],
	};

	await expect(driver.query(abstractQuery)).rejects.toThrow('No client');
});
