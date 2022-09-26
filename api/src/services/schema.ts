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
import { applyDiff } from '../utils/apply-diff';
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

const deepDiffSchema = Joi.object({
	kind: Joi.string().valid('N', 'D', 'E', 'A').required(),
	path: Joi.array().items(Joi.string()),
	lhs: Joi.any().when('kind', { is: 'N', then: Joi.optional(), otherwise: Joi.any() }),
	rhs: Joi.any().when('kind', { is: 'D', then: Joi.optional(), otherwise: Joi.any() }),
	index: Joi.any().when('kind', { is: 'A', then: Joi.number(), otherwise: Joi.optional() }),
	item: Joi.any().when('kind', { is: 'A', then: Joi.any(), otherwise: Joi.optional() }),
});

const applyJoiSchema = Joi.object({
	hash: Joi.string().required(),
	diff: Joi.object({
		collections: Joi.array().items(
			Joi.object({
				collection: Joi.string(),
				diff: Joi.array().items(deepDiffSchema),
			})
		),
		fields: Joi.array().items(
			Joi.object({
				collection: Joi.string(),
				field: Joi.string(),
				diff: Joi.array().items(deepDiffSchema),
			})
		),
		relations: Joi.array().items(
			Joi.object({
				collection: Joi.string(),
				field: Joi.string(),
				related_collection: Joi.any(),
				diff: Joi.array().items(deepDiffSchema),
			})
		),
	}).required(),
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

	async apply(payload: { hash: string; diff: SnapshotDiff }): Promise<void> {
		if (this.accountability?.admin !== true) throw new ForbiddenException();

		const { error } = applyJoiSchema.validate(payload);
		if (error) throw new InvalidPayloadException(error.message);

		const hash = await this.getCurrentHash();

		if (payload.hash !== hash) {
			// TODO: Check collection/field/relation level hash

			throw new InvalidPayloadException(
				`Provided hash ${payload.hash} does not match the current instance's hash ${hash}. Please regenerate a new diff and try again.`
			);
		}

		if (
			payload.diff.collections.length === 0 &&
			payload.diff.fields.length === 0 &&
			payload.diff.relations.length === 0
		) {
			return;
		}

		const currentSnapshot = await this.snapshot();
		await applyDiff(currentSnapshot, payload.diff, { database: this.knex });
	}

	async diff(snapshot: Snapshot, options: { force: boolean }): Promise<SnapshotDiff | null> {
		if (this.accountability?.admin !== true) throw new ForbiddenException();

		if (snapshot.directus !== currentDirectusVersion && !options.force) {
			throw new InvalidPayloadException(
				`Provided snapshot's directus version ${snapshot.directus} does not match the current instance's version ${currentDirectusVersion}`
			);
		}

		const { error } = snapshotJoiSchema.validate(snapshot);
		if (error) throw new InvalidPayloadException(error.message);

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
