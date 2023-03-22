import type { SchemaOverview } from '@directus/shared/types';
import type { Knex } from 'knex';
import { getCache } from '../cache';
import getDatabase from '../database';
import type { Snapshot, SnapshotDiff } from '../types';
import { applyDiff } from './apply-diff';
import { getSchema } from './get-schema';
import { getSnapshot } from './get-snapshot';
import { getSnapshotDiff } from './get-snapshot-diff';

export async function applySnapshot(
	snapshot: Snapshot,
	options?: { database?: Knex; schema?: SchemaOverview; current?: Snapshot; diff?: SnapshotDiff }
): Promise<void> {
	const database = options?.database ?? getDatabase();
	const schema = options?.schema ?? (await getSchema({ database, bypassCache: true }));
	const { systemCache } = getCache();

	const current = options?.current ?? (await getSnapshot({ database, schema }));
	const snapshotDiff = options?.diff ?? getSnapshotDiff(current, snapshot);

	await applyDiff(current, snapshotDiff, { database, schema });

	await systemCache?.clear();
}
