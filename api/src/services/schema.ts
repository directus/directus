import { Accountability } from '@directus/shared/types';
import { getSimpleHash } from '@directus/shared/utils';
import { Knex } from 'knex';
import { version as currentDirectusVersion } from '../../package.json';
import getDatabase from '../database';
import { ForbiddenException } from '../exceptions';
import { AbstractServiceOptions, Snapshot, SnapshotDiff } from '../types';
import { applySnapshot } from '../utils/apply-snapshot';
import { getSnapshot } from '../utils/get-snapshot';
import { getSnapshotDiff } from '../utils/get-snapshot-diff';

export class SchemaService {
	knex: Knex;
	accountability: Accountability | null;

	constructor(options: Omit<AbstractServiceOptions, 'schema'>) {
		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
	}

	async snapshot(): Promise<Snapshot> {
		if (this.accountability?.admin !== true) throw new ForbiddenException();

		const currentSnapshot = await getSnapshot({ database: this.knex });

		return currentSnapshot;
	}

	async apply(diff: SnapshotDiff): Promise<void> {
		if (this.accountability?.admin !== true) throw new ForbiddenException();

		const currentSnapshot = await this.snapshot();

		if (diff.collections.length === 0 && diff.fields.length === 0 && diff.relations.length === 0) {
			return;
		}

		// intentionally don't try/catch to let errors bubble up
		// TODO: remove "{} as any" temporary workaround
		await applySnapshot({} as any, { current: currentSnapshot, diff, database: this.knex });
	}

	async diff(snapshot: Snapshot): Promise<SnapshotDiff | null> {
		if (this.accountability?.admin !== true) throw new ForbiddenException();

		const currentSnapshot = await getSnapshot({ database: this.knex });
		const diff = getSnapshotDiff(currentSnapshot, snapshot);

		if (diff.collections.length === 0 && diff.fields.length === 0 && diff.relations.length === 0) {
			return null;
		}

		return diff;
	}

	async getCurrentHash(): Promise<string> {
		if (this.accountability?.admin !== true) throw new ForbiddenException();

		const currentSnapshot = await this.snapshot();

		const hash = getSimpleHash(`${JSON.stringify(currentSnapshot)}_${currentDirectusVersion}`);

		return hash;
	}
}
