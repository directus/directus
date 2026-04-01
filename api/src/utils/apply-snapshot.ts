import type { SchemaOverview, Snapshot, SnapshotDiff } from '@directus/types';
import type { Knex } from 'knex';
import { flushCaches } from '../cache.js';
import getDatabase from '../database/index.js';
import { applyDiff } from './apply-diff.js';
import { getSchema } from './get-schema.js';
import { getSnapshotDiff } from './get-snapshot-diff.js';
import { getSnapshot } from './get-snapshot.js';

export async function applySnapshot(
	snapshot: Snapshot,
	options?: { database?: Knex; schema?: SchemaOverview; current?: Snapshot; diff?: SnapshotDiff },
): Promise<void> {
	const database = options?.database ?? getDatabase();
	const schema = options?.schema ?? (await getSchema({ database, bypassCache: true }));
	const current = options?.current ?? (await getSnapshot({ database, schema, includeUntracked: true }));
	const snapshotDiff = options?.diff ?? getSnapshotDiff(current, snapshot);

	await applyDiff(current, snapshotDiff, { database, schema });

	await flushCaches();
}
