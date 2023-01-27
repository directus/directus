import { TYPES } from '@directus/shared/constants';
import { Accountability } from '@directus/shared/types';
import Joi from 'joi';
import { Knex } from 'knex';
import { version as currentDirectusVersion } from '../../package.json';
import { ALIAS_TYPES, KIND } from '../constants';
import getDatabase, { getDatabaseClient } from '../database';
import { ForbiddenException, InvalidPayloadException } from '../exceptions';
import {
	AbstractServiceOptions,
	DatabaseClients,
	Snapshot,
	SnapshotDiff,
	SnapshotDiffWithHash,
	SnapshotWithHash,
} from '../types';
import { applyDiff } from '../utils/apply-diff';
import { getSnapshot } from '../utils/get-snapshot';
import { getSnapshotDiff } from '../utils/get-snapshot-diff';
import { getVersionedHash } from '../utils/get-versioned-hash';

const snapshotJoiSchema = Joi.object({
	version: Joi.number().valid(1).required(),
	directus: Joi.string().required(),
	vendor: Joi.string()
		.valid(...DatabaseClients)
		.optional(),
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

		const { error } = applyJoiSchema.validate(payload);

		if (error) throw new InvalidPayloadException(error.message);

		const currentSnapshot = await this.snapshot();

		const snapshotWithHash = this.getHashedSnapshot(currentSnapshot);

		if (
			payload.diff.collections.length === 0 &&
			payload.diff.fields.length === 0 &&
			payload.diff.relations.length === 0
		) {
			return;
		}

		if (payload.hash !== snapshotWithHash.hash) {
			for (const diffCollection of payload.diff.collections) {
				const collection = diffCollection.collection;

				if (diffCollection.diff[0]?.kind === KIND.NEW) {
					const existingCollection = snapshotWithHash.collections.find(
						(c) => c.collection === diffCollection.collection
					);

					if (existingCollection) {
						throw new InvalidPayloadException(
							`Provided diff is trying to create collection "${collection}" but it already exists. Please generate a new diff and try again.`
						);
					}
				} else if (diffCollection.diff[0]?.kind === KIND.DELETE) {
					const existingCollection = snapshotWithHash.collections.find(
						(c) => c.collection === diffCollection.collection
					);

					if (!existingCollection) {
						throw new InvalidPayloadException(
							`Provided diff is trying to delete collection "${collection}" but it does not exist. Please generate a new diff and try again.`
						);
					}
				}
			}
			for (const diffField of payload.diff.fields) {
				const field = `${diffField.collection}.${diffField.field}`;

				if (diffField.diff[0]?.kind === KIND.NEW) {
					const existingField = snapshotWithHash.fields.find(
						(f) => f.collection === diffField.collection && f.field === diffField.field
					);

					if (existingField) {
						throw new InvalidPayloadException(
							`Provided diff is trying to create field "${field}" but it already exists. Please generate a new diff and try again.`
						);
					}
				} else if (diffField.diff[0]?.kind === KIND.DELETE) {
					const existingField = snapshotWithHash.fields.find(
						(f) => f.collection === diffField.collection && f.field === diffField.field
					);

					if (!existingField) {
						throw new InvalidPayloadException(
							`Provided diff is trying to delete field "${field}" but it does not exist. Please generate a new diff and try again.`
						);
					}
				}
			}
			for (const diffRelation of payload.diff.relations) {
				let relation = `${diffRelation.collection}.${diffRelation.field}`;
				if (diffRelation.related_collection) relation += `-> ${diffRelation.related_collection}`;

				if (diffRelation.diff[0]?.kind === KIND.NEW) {
					const existingRelation = snapshotWithHash.relations.find(
						(r) => r.collection === diffRelation.collection && r.field === diffRelation.field
					);

					if (existingRelation) {
						throw new InvalidPayloadException(
							`Provided diff is trying to create relation "${relation}" but it already exists. Please generate a new diff and try again.`
						);
					}
				} else if (diffRelation.diff[0]?.kind === KIND.DELETE) {
					const existingRelation = snapshotWithHash.relations.find(
						(r) => r.collection === diffRelation.collection && r.field === diffRelation.field
					);

					if (!existingRelation) {
						throw new InvalidPayloadException(
							`Provided diff is trying to delete relation "${relation}" but it does not exist. Please generate a new diff and try again.`
						);
					}
				}
			}

			throw new InvalidPayloadException(
				`Provided hash does not match the current instance's schema hash, indicating the schema has changed after this diff was generated. Please generate a new diff and try again.`
			);
		}

		await applyDiff(currentSnapshot, payload.diff, { database: this.knex });
	}

	async diff(
		snapshot: Snapshot,
		options?: { currentSnapshot?: Snapshot; force?: boolean }
	): Promise<SnapshotDiff | null> {
		if (this.accountability?.admin !== true) throw new ForbiddenException();

		if (!options?.force) {
			if (snapshot.directus !== currentDirectusVersion) {
				throw new InvalidPayloadException(
					`Provided snapshot's directus version ${snapshot.directus} does not match the current instance's version ${currentDirectusVersion}. You can bypass this check by passing the "force" query parameter.`
				);
			}

			if (!snapshot.vendor) {
				throw new InvalidPayloadException(
					'Provided snapshot does not contain the "vendor" property. You can bypass this check by passing the "force" query parameter.'
				);
			}

			const currentVendor = getDatabaseClient();

			if (snapshot.vendor !== currentVendor) {
				throw new InvalidPayloadException(
					`Provided snapshot's vendor ${snapshot.vendor} does not match the current instance's vendor ${currentVendor}. You can bypass this check by passing the "force" query parameter.`
				);
			}
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
			...snapshot,
			hash: snapshotHash,
		};
	}
}
