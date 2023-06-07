import type { Field, Relation, SchemaOverview } from '@directus/types';
import type { Diff, DiffDeleted, DiffNew } from 'deep-diff';
import deepDiff from 'deep-diff';
import type { Knex } from 'knex';
import { cloneDeep, merge, set } from 'lodash-es';
import { clearSystemCache } from '../cache.js';
import { getHelpers } from '../database/helpers/index.js';
import getDatabase from '../database/index.js';
import emitter from '../emitter.js';
import logger from '../logger.js';
import { CollectionsService } from '../services/collections.js';
import { FieldsService } from '../services/fields.js';
import { RelationsService } from '../services/relations.js';
import type {
	ActionEventParams,
	Collection,
	MutationOptions,
	Snapshot,
	SnapshotDiff,
	SnapshotField,
} from '../types/index.js';
import { DiffKind } from '../types/index.js';
import { getSchema } from './get-schema.js';

type CollectionDelta = {
	collection: string;
	diff: Diff<Collection | undefined>[];
};

export async function applyDiff(
	currentSnapshot: Snapshot,
	snapshotDiff: SnapshotDiff,
	options?: { database?: Knex; schema?: SchemaOverview }
): Promise<void> {
	const database = options?.database ?? getDatabase();
	const helpers = getHelpers(database);
	const schema = options?.schema ?? (await getSchema({ database, bypassCache: true }));

	const nestedActionEvents: ActionEventParams[] = [];

	const mutationOptions: MutationOptions = {
		autoPurgeSystemCache: false,
		bypassEmitAction: (params) => nestedActionEvents.push(params),
		bypassLimits: true,
	};

	const runPostColumnChange = await helpers.schema.preColumnChange();

	await database.transaction(async (trx) => {
		const collectionsService = new CollectionsService({ knex: trx, schema });

		const getNestedCollectionsToCreate = (currentLevelCollection: string) =>
			snapshotDiff.collections.filter(
				({ diff }) => (diff[0] as DiffNew<Collection>).rhs?.meta?.group === currentLevelCollection
			) as CollectionDelta[];

		const getNestedCollectionsToDelete = (currentLevelCollection: string) =>
			snapshotDiff.collections.filter(
				({ diff }) => (diff[0] as DiffDeleted<Collection>).lhs?.meta?.group === currentLevelCollection
			) as CollectionDelta[];

		const createCollections = async (collections: CollectionDelta[]) => {
			for (const { collection, diff } of collections) {
				if (diff?.[0]?.kind === DiffKind.NEW && diff[0].rhs) {
					// We'll nest the to-be-created fields in the same collection creation, to prevent
					// creating a collection without a primary key
					const fields = snapshotDiff.fields
						.filter((fieldDiff) => fieldDiff.collection === collection)
						.map((fieldDiff) => (fieldDiff.diff[0] as DiffNew<Field>).rhs)
						.map((fieldDiff) => {
							// Casts field type to UUID when applying non-PostgreSQL schema onto PostgreSQL database.
							// This is needed because they snapshots UUID fields as char/varchar with length 36.
							if (
								['char', 'varchar'].includes(String(fieldDiff.schema?.data_type).toLowerCase()) &&
								fieldDiff.schema?.max_length === 36 &&
								(fieldDiff.schema?.is_primary_key ||
									(fieldDiff.schema?.foreign_key_table && fieldDiff.schema?.foreign_key_column))
							) {
								return merge(fieldDiff, { type: 'uuid', schema: { data_type: 'uuid', max_length: null } });
							} else {
								return fieldDiff;
							}
						});

					try {
						await collectionsService.createOne(
							{
								...diff[0].rhs,
								fields,
							},
							mutationOptions
						);
					} catch (err: any) {
						logger.error(`Failed to create collection "${collection}"`);
						throw err;
					}

					// Now that the fields are in for this collection, we can strip them from the field edits
					snapshotDiff.fields = snapshotDiff.fields.filter((fieldDiff) => fieldDiff.collection !== collection);

					await createCollections(getNestedCollectionsToCreate(collection));
				}
			}
		};

		const deleteCollections = async (collections: CollectionDelta[]) => {
			for (const { collection, diff } of collections) {
				if (diff?.[0]?.kind === DiffKind.DELETE) {
					const relations = schema.relations.filter(
						(r) => r.related_collection === collection || r.collection === collection
					);

					if (relations.length > 0) {
						const relationsService = new RelationsService({ knex: trx, schema });

						for (const relation of relations) {
							try {
								await relationsService.deleteOne(relation.collection, relation.field, mutationOptions);
							} catch (err) {
								logger.error(
									`Failed to delete collection "${collection}" due to relation "${relation.collection}.${relation.field}"`
								);

								throw err;
							}
						}

						// clean up deleted relations from existing schema
						schema.relations = schema.relations.filter(
							(r) => r.related_collection !== collection && r.collection !== collection
						);
					}

					await deleteCollections(getNestedCollectionsToDelete(collection));

					try {
						await collectionsService.deleteOne(collection, mutationOptions);
					} catch (err) {
						logger.error(`Failed to delete collection "${collection}"`);
						throw err;
					}
				}
			}
		};

		// Finds all collections that need to be created
		const filterCollectionsForCreation = ({ diff }: { collection: string; diff: Diff<Collection | undefined>[] }) => {
			// Check new collections only
			const isNewCollection = diff[0]?.kind === DiffKind.NEW;
			if (!isNewCollection) return false;

			// Create now if no group
			const groupName = (diff[0] as DiffNew<Collection>).rhs.meta?.group;
			if (!groupName) return true;

			// Check if parent collection already exists in schema
			const parentExists = currentSnapshot.collections.find((c) => c.collection === groupName) !== undefined;

			// If this is a new collection and the parent collection doesn't exist in current schema ->
			// Check if the parent collection will be created as part of applying this snapshot ->
			// If yes -> this collection will be created recursively
			// If not -> create now
			// (ex.)
			// TopLevelCollection - I exist in current schema
			// 		NestedCollection - I exist in snapshotDiff as a new collection
			//			TheCurrentCollectionInIteration - I exist in snapshotDiff as a new collection but will be created as part of NestedCollection
			const parentWillBeCreatedInThisApply =
				snapshotDiff.collections.filter(
					({ collection, diff }) => diff[0]?.kind === DiffKind.NEW && collection === groupName
				).length > 0;

			// Has group, but parent is not new, parent is also not being created in this snapshot apply
			if (parentExists && !parentWillBeCreatedInThisApply) return true;

			return false;
		};

		// Create top level collections (no group, or highest level in existing group) first,
		// then continue with nested collections recursively
		await createCollections(snapshotDiff.collections.filter(filterCollectionsForCreation));

		// delete top level collections (no group) first, then continue with nested collections recursively
		await deleteCollections(
			snapshotDiff.collections.filter(({ diff }) => {
				if (diff.length === 0 || diff[0] === undefined) return false;
				const collectionDiff = diff[0] as DiffDeleted<Collection>;
				return collectionDiff.kind === DiffKind.DELETE && collectionDiff.lhs?.meta?.group === null;
			})
		);

		for (const { collection, diff } of snapshotDiff.collections) {
			if (diff?.[0]?.kind === DiffKind.EDIT || diff?.[0]?.kind === DiffKind.ARRAY) {
				const currentCollection = currentSnapshot.collections.find((field) => {
					return field.collection === collection;
				});

				if (currentCollection) {
					try {
						const newValues = diff.reduce((acc, currentDiff) => {
							deepDiff.applyChange(acc, undefined, currentDiff);
							return acc;
						}, cloneDeep(currentCollection));

						await collectionsService.updateOne(collection, newValues, mutationOptions);
					} catch (err) {
						logger.error(`Failed to update collection "${collection}"`);
						throw err;
					}
				}
			}
		}

		const fieldsService = new FieldsService({
			knex: trx,
			schema: await getSchema({ database: trx, bypassCache: true }),
		});

		for (const { collection, field, diff } of snapshotDiff.fields) {
			if (diff?.[0]?.kind === DiffKind.NEW && !isNestedMetaUpdate(diff?.[0])) {
				try {
					await fieldsService.createField(collection, (diff[0] as DiffNew<Field>).rhs, undefined, mutationOptions);
				} catch (err) {
					logger.error(`Failed to create field "${collection}.${field}"`);
					throw err;
				}
			}

			if (diff?.[0]?.kind === DiffKind.EDIT || diff?.[0]?.kind === DiffKind.ARRAY || isNestedMetaUpdate(diff[0]!)) {
				const currentField = currentSnapshot.fields.find((snapshotField) => {
					return snapshotField.collection === collection && snapshotField.field === field;
				});

				if (currentField) {
					try {
						const newValues = diff.reduce((acc, currentDiff) => {
							deepDiff.applyChange(acc, undefined, currentDiff);
							return acc;
						}, cloneDeep(currentField));

						await fieldsService.updateField(collection, newValues, mutationOptions);
					} catch (err) {
						logger.error(`Failed to update field "${collection}.${field}"`);
						throw err;
					}
				}
			}

			if (diff?.[0]?.kind === DiffKind.DELETE && !isNestedMetaUpdate(diff?.[0])) {
				try {
					await fieldsService.deleteField(collection, field, mutationOptions);
				} catch (err) {
					logger.error(`Failed to delete field "${collection}.${field}"`);
					throw err;
				}

				// Field deletion also cleans up the relationship. We should ignore any relationship
				// changes attached to this now non-existing field
				snapshotDiff.relations = snapshotDiff.relations.filter(
					(relation) => (relation.collection === collection && relation.field === field) === false
				);
			}
		}

		const relationsService = new RelationsService({
			knex: trx,
			schema: await getSchema({ database: trx, bypassCache: true }),
		});

		for (const { collection, field, diff } of snapshotDiff.relations) {
			const structure = {};

			for (const diffEdit of diff) {
				set(structure, diffEdit.path!, undefined);
			}

			if (diff?.[0]?.kind === DiffKind.NEW) {
				try {
					await relationsService.createOne((diff[0] as DiffNew<Relation>).rhs, mutationOptions);
				} catch (err) {
					logger.error(`Failed to create relation "${collection}.${field}"`);
					throw err;
				}
			}

			if (diff?.[0]?.kind === DiffKind.EDIT || diff?.[0]?.kind === DiffKind.ARRAY) {
				const currentRelation = currentSnapshot.relations.find((relation) => {
					return relation.collection === collection && relation.field === field;
				});

				if (currentRelation) {
					try {
						const newValues = diff.reduce((acc, currentDiff) => {
							deepDiff.applyChange(acc, undefined, currentDiff);
							return acc;
						}, cloneDeep(currentRelation));

						await relationsService.updateOne(collection, field, newValues, mutationOptions);
					} catch (err) {
						logger.error(`Failed to update relation "${collection}.${field}"`);
						throw err;
					}
				}
			}

			if (diff?.[0]?.kind === DiffKind.DELETE) {
				try {
					await relationsService.deleteOne(collection, field, mutationOptions);
				} catch (err) {
					logger.error(`Failed to delete relation "${collection}.${field}"`);
					throw err;
				}
			}
		}
	});

	if (runPostColumnChange) {
		await helpers.schema.postColumnChange();
	}

	await clearSystemCache();

	if (nestedActionEvents.length > 0) {
		const updatedSchema = await getSchema({ database, bypassCache: true });

		for (const nestedActionEvent of nestedActionEvents) {
			nestedActionEvent.context.schema = updatedSchema;
			emitter.emitAction(nestedActionEvent.event, nestedActionEvent.meta, nestedActionEvent.context);
		}
	}
}

export function isNestedMetaUpdate(diff: Diff<SnapshotField | undefined>): boolean {
	if (!diff) return false;
	if (diff.kind !== DiffKind.NEW && diff.kind !== DiffKind.DELETE) return false;
	if (!diff.path || diff.path.length < 2 || diff.path[0] !== 'meta') return false;
	return true;
}
