import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { getCache } from '../cache.js';
import getDatabase from '../database/index.js';
import type { Snapshot, SnapshotDiff } from '../types/index.js';
import { applyDiff } from './apply-diff.js';
import { getSchema } from './get-schema.js';
import { getSnapshot } from './get-snapshot.js';
import { getSnapshotDiff } from './get-snapshot-diff.js';

export async function applySnapshot(
	snapshot: Snapshot,
	options?: { database?: Knex; schema?: SchemaOverview; current?: Snapshot; diff?: SnapshotDiff },
): Promise<void> {
	const database = options?.database ?? getDatabase();
	const schema = options?.schema ?? (await getSchema({ database, bypassCache: true }));
	const { systemCache } = getCache();

	const current = options?.current ?? (await getSnapshot({ database, schema }));
	const snapshotDiff = options?.diff ?? getSnapshotDiff(current, snapshot);

	await applyDiff(current, snapshotDiff, { database, schema });

	await systemCache?.clear();
}
