import { Snapshot, SchemaOverview } from '../types';
import { getSnapshot } from './get-snapshot';
import { Knex } from 'knex';
import getDatabase from '../database';
import { getSchema } from './get-schema';

export async function applySnapshot(snapshot: Snapshot, options?: { database?: Knex; schema?: SchemaOverview }) {
	const database = options?.database ?? getDatabase();
	const schema = options?.schema ?? (await getSchema({ database }));

	const current = await getSnapshot({ database, schema });

	console.log(current, snapshot);
}
