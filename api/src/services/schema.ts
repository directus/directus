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
				hash: Joi.string().when('diff.0.kind', { is: 'N', then: Joi.optional(), otherwise: Joi.any() }),
				collection: Joi.string(),
				diff: Joi.array().items(deepDiffSchema),
			})
		),
		fields: Joi.array().items(
			Joi.object({
				hash: Joi.string().when('diff.0.kind', { is: 'N', then: Joi.optional(), otherwise: Joi.any() }),
				collection: Joi.string(),
				field: Joi.string(),
				diff: Joi.array().items(deepDiffSchema),
			})
		),
		relations: Joi.array().items(
			Joi.object({
				hash: Joi.string().when('diff.0.kind', { is: 'N', then: Joi.optional(), otherwise: Joi.any() }),
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
				const collection = diffCollection.collection;

				if (diffCollection.diff[0]?.kind === 'N') {
					const existingCollection = snapshotWithHash.collections.find(
						(c) => c.collection === diffCollection.collection
					);
					if (existingCollection) {
						throw new InvalidPayloadException(
							`Provided diff is trying to create collection "${collection}" but it already exists. Please regenerate a new diff and try again.`
						);
					}
				} else if (diffCollection.diff[0]?.kind === 'D') {
					const existingCollection = snapshotWithHash.collections.find(
						(c) => c.collection === diffCollection.collection
					);
					if (!existingCollection) {
						throw new InvalidPayloadException(
							`Provided diff is trying to delete collection "${collection}" but it does not exist. Please regenerate a new diff and try again.`
						);
					}
				} else {
					const matchingCollection = snapshotWithHash.collections.find((c) => c.hash === diffCollection.hash);
					if (!matchingCollection) {
						throw new InvalidPayloadException(
							`Provided diff to update collection "${collection}" does not match the current instance's collection, indicating it has changed after this diff was generated. Please regenerate a new diff and try again.`
						);
					}
				}
			}
			for (const diffField of payload.diff.fields) {
				const field = `${diffField.collection}.${diffField.field}`;

				if (diffField.diff[0]?.kind === 'N') {
					const existingField = snapshotWithHash.fields.find(
						(f) => f.collection === diffField.collection && f.field === diffField.field
					);
					if (existingField) {
						throw new InvalidPayloadException(
							`Provided diff is trying to create field "${field}" but it already exists. Please regenerate a new diff and try again.`
						);
					}
				} else if (diffField.diff[0]?.kind === 'D') {
					const existingField = snapshotWithHash.fields.find(
						(f) => f.collection === diffField.collection && f.field === diffField.field
					);
					if (!existingField) {
						throw new InvalidPayloadException(
							`Provided diff is trying to delete field "${field}" but it does not exist. Please regenerate a new diff and try again.`
						);
					}
				} else {
					const matchingField = snapshotWithHash.fields.find((f) => f.hash === diffField.hash);
					if (!matchingField) {
						throw new InvalidPayloadException(
							`Provided diff to update field "${field}" does not match the current instance's field, indicating it has changed after this diff was generated. Please regenerate a new diff and try again.`
						);
					}
				}
			}
			for (const diffRelation of payload.diff.relations) {
				let relation = `${diffRelation.collection}.${diffRelation.field}`;
				if (diffRelation.related_collection) relation += `-> ${diffRelation.related_collection}`;

				if (diffRelation.diff[0]?.kind === 'N') {
					const existingRelation = snapshotWithHash.relations.find(
						(r) => r.collection === diffRelation.collection && r.field === diffRelation.field
					);
					if (existingRelation) {
						throw new InvalidPayloadException(
							`Provided diff is trying to create relation "${relation}" but it already exists. Please regenerate a new diff and try again.`
						);
					}
				} else if (diffRelation.diff[0]?.kind === 'D') {
					const existingRelation = snapshotWithHash.relations.find(
						(r) => r.collection === diffRelation.collection && r.field === diffRelation.field
					);
					if (!existingRelation) {
						throw new InvalidPayloadException(
							`Provided diff is trying to delete relation "${relation}" but it does not exist. Please regenerate a new diff and try again.`
						);
					}
				} else {
					const matchingRelation = snapshotWithHash.relations.find((r) => r.hash === diffRelation.hash);
					if (!matchingRelation) {
						throw new InvalidPayloadException(
							`Provided diff for relation "${relation}" does not match the current instance's relation, indicating it has changed after this diff was generated. Please regenerate a new diff and try again.`
						);
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

	async diff(
		snapshot: Snapshot,
		options?: { currentSnapshot?: Snapshot; force?: boolean }
	): Promise<SnapshotDiff | null> {
		if (this.accountability?.admin !== true) throw new ForbiddenException();

		if (snapshot.directus !== currentDirectusVersion && !options?.force) {
			throw new InvalidPayloadException(
				`Provided snapshot's directus version ${snapshot.directus} does not match the current instance's version ${currentDirectusVersion}`
			);
		}

		const { error } = snapshotJoiSchema.validate(snapshot);
		if (error) throw new InvalidPayloadException(error.message);

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
