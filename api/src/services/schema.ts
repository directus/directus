import { Accountability, SchemaOverview } from '@directus/shared/types';
import { Knex } from 'knex';
import { flushCaches } from '../cache';
import getDatabase from '../database';
import { ForbiddenException, InvalidPayloadException } from '../exceptions';
import { AbstractServiceOptions, Snapshot, SnapshotDiff } from '../types';
import { applySnapshot } from '../utils/apply-snapshot';
import { getSnapshot } from '../utils/get-snapshot';
import { getSnapshotDiff } from '../utils/get-snapshot-diff';

export class SchemaService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.schema = options.schema;
	}

	async snapshot(): Promise<Snapshot> {
		if (this.accountability?.admin !== true) throw new ForbiddenException();

		await flushCaches();

		const currentSnapshot = await getSnapshot({ database: this.knex, schema: this.schema });

		return currentSnapshot;
	}

	async apply(snapshot: Snapshot): Promise<void> {
		if (this.accountability?.admin !== true) throw new ForbiddenException();

		await flushCaches();

		const currentSnapshot = await getSnapshot({ database: this.knex, schema: this.schema });
		const snapshotDiff = getSnapshotDiff(currentSnapshot, snapshot);

		if (
			snapshotDiff.collections.length === 0 &&
			snapshotDiff.fields.length === 0 &&
			snapshotDiff.relations.length === 0
		) {
			return;
		}

		try {
			await applySnapshot(snapshot, { current: currentSnapshot, diff: snapshotDiff, database: this.knex });
		} catch (err: any) {
			throw new InvalidPayloadException('Failed to apply snapshot');
		}
	}

	async diff(snapshot: Snapshot): Promise<SnapshotDiff | null> {
		if (this.accountability?.admin !== true) throw new ForbiddenException();

		await flushCaches();

		const currentSnapshot = await getSnapshot({ database: this.knex, schema: this.schema });
		const snapshotDiff = getSnapshotDiff(currentSnapshot, snapshot);

		if (
			snapshotDiff.collections.length === 0 &&
			snapshotDiff.fields.length === 0 &&
			snapshotDiff.relations.length === 0
		) {
			return null;
		}

		return snapshotDiff;
	}
}
