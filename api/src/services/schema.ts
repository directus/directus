import { ForbiddenError } from '@directus/errors';
import type {
	AbstractServiceOptions,
	Accountability,
	Snapshot,
	SnapshotDiff,
	SnapshotDiffWithHash,
	SnapshotWithHash,
} from '@directus/types';
import type { Knex } from 'knex';
import getDatabase from '../database/index.js';
import { getVersionedHash } from '../utils/get-versioned-hash.js';
import { applyDiff } from '../utils/schema/apply-diff.js';
import { getSnapshotDiff } from '../utils/schema/get-snapshot-diff.js';
import { getSnapshot } from '../utils/schema/get-snapshot.js';
import { validateApplyDiff } from '../utils/schema/validate-diff.js';
import { validateSnapshot } from '../utils/schema/validate-snapshot.js';

export class SchemaService {
	knex: Knex;
	accountability: Accountability | null;

	constructor(options: Omit<AbstractServiceOptions, 'schema'>) {
		this.knex = options.knex ?? getDatabase();
		this.accountability = options.accountability ?? null;
	}

	/** Snapshot the schema, optionally scoped to a subset of `collections` (a partial snapshot). Admin only. */
	async snapshot(options?: { collections?: string[] | undefined }): Promise<Snapshot> {
		if (this.accountability?.admin !== true) throw new ForbiddenError();

		const currentSnapshot = await getSnapshot({ database: this.knex, collections: options?.collections });

		return currentSnapshot;
	}

	async apply(payload: SnapshotDiffWithHash, options?: { force?: boolean }): Promise<void> {
		if (this.accountability?.admin !== true) throw new ForbiddenError();

		const currentSnapshot = await this.snapshot();

		const snapshotWithHash = this.getHashedSnapshot(currentSnapshot);

		if (!validateApplyDiff(payload, snapshotWithHash, options?.force)) return;

		await applyDiff(currentSnapshot, payload.diff, { database: this.knex });
	}

	async diff(
		snapshot: Snapshot,
		options?: { currentSnapshot?: Snapshot; force?: boolean; mode?: 'merge' | 'mirror' },
	): Promise<SnapshotDiff | null> {
		if (this.accountability?.admin !== true) throw new ForbiddenError();

		validateSnapshot(snapshot, options?.force);

		const currentSnapshot = options?.currentSnapshot ?? (await getSnapshot({ database: this.knex }));

		const diff = getSnapshotDiff(currentSnapshot, snapshot, { mode: options?.mode });

		if (
			diff.collections.length === 0 &&
			diff.fields.length === 0 &&
			diff.relations.length === 0 &&
			(!diff.systemFields || diff.systemFields.length === 0)
		) {
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
