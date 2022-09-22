import { TYPES } from '@directus/shared/constants';
import { Accountability } from '@directus/shared/types';
import { getSimpleHash } from '@directus/shared/utils';
import Joi from 'joi';
import { Knex } from 'knex';
import { version as currentDirectusVersion } from '../../package.json';
import { ALIAS_TYPES } from '../constants';
import getDatabase from '../database';
import { ForbiddenException, InvalidPayloadException } from '../exceptions';
import { AbstractServiceOptions, Snapshot, SnapshotDiff } from '../types';
import { applySnapshot } from '../utils/apply-snapshot';
import { getSnapshot } from '../utils/get-snapshot';
import { getSnapshotDiff } from '../utils/get-snapshot-diff';

const snapshotJoiSchema = Joi.object({
	version: Joi.number().required(),
	directus: Joi.string().required(),
	vendor: Joi.string().valid('mysql', 'postgres', 'cockroachdb', 'sqlite', 'oracle', 'mssql', 'redshift').optional(),
	collections: Joi.array().items(
		Joi.object({
			collection: Joi.string(),
			meta: Joi.any(),
			schema: Joi.object({
				name: Joi.string(),
			}),
		})
	),
	fields: Joi.array().items(
		Joi.object({
			collection: Joi.string(),
			field: Joi.string(),
			meta: Joi.any(),
			schema: Joi.object({
				default_value: Joi.any(),
				max_length: [Joi.number(), Joi.string(), Joi.valid(null)],
				is_nullable: Joi.bool(),
			})
				.unknown()
				.allow(null),
			type: Joi.string()
				.valid(...TYPES, ...ALIAS_TYPES)
				.allow(null),
		})
	),
	relations: Joi.array().items(
		Joi.object({
			collection: Joi.string(),
			field: Joi.string(),
			meta: Joi.any(),
			related_collection: Joi.any(),
			schema: Joi.any(),
		})
	),
});

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

		const { error } = snapshotJoiSchema.validate(snapshot);

		if (error) {
			throw new InvalidPayloadException(error.message);
		}

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
