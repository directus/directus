import type { Accountability } from '@directus/shared/types';
import type { Knex } from 'knex';
import getDatabase from '../database';
import { ForbiddenException } from '../exceptions';
import type { AbstractServiceOptions, Snapshot, SnapshotDiff, SnapshotDiffWithHash, SnapshotWithHash } from '../types';
import { applyDiff } from '../utils/apply-diff';
import { getSnapshot } from '../utils/get-snapshot';
import { getSnapshotDiff } from '../utils/get-snapshot-diff';
import { getVersionedHash } from '../utils/get-versioned-hash';
import { validateApplyDiff } from '../utils/validate-diff';
import { validateSnapshot } from '../utils/validate-snapshot';

export class SchemaService {
	knex: Knex;
	accountability: Accountability | null;

	constructor(options: Omit<AbstractServiceOptions, 'schema'>) {
		this.knex = options.knex ?? getDatabase();
		this.accountability = options.accountability ?? null;
	}

	async snapshot(): Promise<Snapshot> {
		if (this.accountability?.admin !== true) throw new ForbiddenException();

		const currentSnapshot = await getSnapshot({ database: this.knex });

		return currentSnapshot;
	}

	async apply(payload: SnapshotDiffWithHash): Promise<void> {
		if (this.accountability?.admin !== true) throw new ForbiddenException();

		const currentSnapshot = await this.snapshot();
		const snapshotWithHash = this.getHashedSnapshot(currentSnapshot);

		if (!validateApplyDiff(payload, snapshotWithHash)) return;

		await applyDiff(currentSnapshot, payload.diff, { database: this.knex });
	}

	async diff(
		snapshot: Snapshot,
		options?: { currentSnapshot?: Snapshot; force?: boolean }
	): Promise<SnapshotDiff | null> {
		if (this.accountability?.admin !== true) throw new ForbiddenException();

		validateSnapshot(snapshot, options?.force);

		const currentSnapshot = options?.currentSnapshot ?? (await getSnapshot({ database: this.knex }));
		const diff = getSnapshotDiff(currentSnapshot, snapshot);

		if (diff.collections.length === 0 && diff.fields.length === 0 && diff.relations.length === 0) {
			return null;
		}

		return diff;
	}

	getHashedSnapshot(snapshot: Snapshot): SnapshotWithHash {
		const snapshotHash = getVersionedHash(snapshot);

		return {
			...snapshot,
			hash: snapshotHash,
		};
	}
}
