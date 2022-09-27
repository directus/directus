import { TYPES } from '@directus/shared/constants';
import { Accountability } from '@directus/shared/types';
import Joi from 'joi';
import { Knex } from 'knex';
import { version as currentDirectusVersion } from '../../package.json';
import { ALIAS_TYPES } from '../constants';
import getDatabase from '../database';
import { ForbiddenException, InvalidPayloadException } from '../exceptions';
import { AbstractServiceOptions, Snapshot, SnapshotDiff, SnapshotWithHash } from '../types';
import { applyDiff } from '../utils/apply-diff';
import { getSnapshot, getVersionedHash } from '../utils/get-snapshot';
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

		const currentSnapshot = await this.snapshot();

		const snapshotWithHash = this.getHashedSnapshot(currentSnapshot);

		if (payload.hash !== snapshotWithHash.hash) {
			for (const diffCollection of payload.diff.collections) {
				if (diffCollection.hash) {
					const matchingCollection = snapshotWithHash.collections.find((c) => c.hash === diffCollection.hash);
					if (!matchingCollection) {
						throw new InvalidPayloadException(
							`Provided diff for collection "${diffCollection.collection}" does not match the current instance's collection, indicating it has changed after this diff was generated. Please regenerate a new diff and try again.`
						);
					}
				}
			}
			for (const diffField of payload.diff.fields) {
				if (diffField.hash) {
					const matchingField = snapshotWithHash.fields.find((f) => f.hash === diffField.hash);
					if (!matchingField) {
						throw new InvalidPayloadException(
							`Provided diff for field "${diffField.collection}.${diffField.field}" does not match the current instance's field, indicating it has changed after this diff was generated. Please regenerate a new diff and try again.`
						);
					}
				}
			}
			for (const diffRelation of payload.diff.relations) {
				if (diffRelation.hash) {
					const matchingRelation = snapshotWithHash.relations.find((r) => r.hash === diffRelation.hash);
					if (!matchingRelation) {
						// Related collection doesn't exist for a2o relationship types
						if (diffRelation.related_collection) {
							throw new InvalidPayloadException(
								`Provided diff for relation "${diffRelation.collection}.${diffRelation.field} -> ${diffRelation.related_collection}" does not match the current instance's relation, indicating it has changed after this diff was generated. Please regenerate a new diff and try again.`
							);
						} else {
							throw new InvalidPayloadException(
								`Provided diff for relation "${diffRelation.collection}.${diffRelation.field}" does not match the current instance's relation, indicating it has changed after this diff was generated. Please regenerate a new diff and try again.`
							);
						}
					}
				}
			}

			throw new InvalidPayloadException(
				`Provided hash "${payload.hash}" does not match the current instance's schema hash "${snapshotWithHash.hash}". Please regenerate a new diff and try again.`
			);
		}

		if (
			payload.diff.collections.length === 0 &&
			payload.diff.fields.length === 0 &&
			payload.diff.relations.length === 0
		) {
			return;
		}

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

	getHashedSnapshot(snapshot: Snapshot): SnapshotWithHash {
		const snapshotHash = getVersionedHash(snapshot);

		return {
			hash: snapshotHash,
			...snapshot,
			collections: snapshot.collections.map(addHash),
			fields: snapshot.fields.map(addHash),
			relations: snapshot.relations.map(addHash),
		};

		function addHash<T extends Record<string, any>>(item: T): T & { hash: string } {
			return {
				hash: getVersionedHash(item),
				...item,
			};
		}
	}
}
