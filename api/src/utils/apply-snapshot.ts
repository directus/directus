import { Field, Relation, SchemaOverview } from '@directus/shared/types';
import { Diff, DiffDeleted, DiffNew } from 'deep-diff';
import { Knex } from 'knex';
import { merge, set } from 'lodash';
import getDatabase from '../database';
import logger from '../logger';
import { CollectionsService, FieldsService, RelationsService } from '../services';
import { ActionEventParams, Collection, MutationOptions, Snapshot, SnapshotDiff, SnapshotField } from '../types';
import { getSchema } from './get-schema';
import { getSnapshot } from './get-snapshot';
import { getSnapshotDiff } from './get-snapshot-diff';
import { getCache } from '../cache';
import emitter from '../emitter';

type CollectionDelta = {
	collection: string;
	diff: Diff<Collection | undefined>[];
};

export async function applySnapshot(
	snapshot: Snapshot,
	options?: { database?: Knex; schema?: SchemaOverview; current?: Snapshot; diff?: SnapshotDiff }
): Promise<void> {
	const database = options?.database ?? getDatabase();
	const schema = options?.schema ?? (await getSchema({ database, bypassCache: true }));
	const { systemCache } = getCache();

	const current = options?.current ?? (await getSnapshot({ database, schema }));
	const snapshotDiff = options?.diff ?? getSnapshotDiff(current, snapshot);

	const nestedActionEvents: ActionEventParams[] = [];
	const mutationOptions: MutationOptions = {
		autoPurgeSystemCache: false,
		bypassEmitAction: (params) => nestedActionEvents.push(params),
	};

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
				if (diff?.[0].kind === 'N' && diff[0].rhs) {
					// We'll nest the to-be-created fields in the same collection creation, to prevent
					// creating a collection without a primary key
					const fields = snapshotDiff.fields
						.filter((fieldDiff) => fieldDiff.collection === collection)
						.map((fieldDiff) => (fieldDiff.diff[0] as DiffNew<Field>).rhs)
						.map((fieldDiff) => {
							// Casts field type to UUID when applying non-PostgreSQL schema onto PostgreSQL database.
							// This is needed because they snapshots UUID fields as char with length 36.
							if (
								fieldDiff.schema?.data_type === 'char' &&
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
				if (diff?.[0].kind === 'D') {
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
			const isNewCollection = diff[0].kind === 'N';
			if (!isNewCollection) return false;

			// Create now if no group
			const groupName = (diff[0] as DiffNew<Collection>).rhs.meta?.group;
			if (!groupName) return true;

			// Check if parent collection already exists in schema
			const parentExists = current.collections.find((c) => c.collection === groupName) !== undefined;
			// If this is a new collection and the parent collection doesn't exist in current schema ->
			// Check if the parent collection will be created as part of applying this snapshot ->
			// If yes -> this collection will be created recursively
			// If not -> create now
			// (ex.)
			// TopLevelCollection - I exist in current schema
			// 		NestedCollection - I exist in snapshotDiff as a new collection
			//			TheCurrentCollectionInIteration - I exist in snapshotDiff as a new collection but will be created as part of NestedCollection
			const parentWillBeCreatedInThisApply =
				snapshotDiff.collections.filter(({ collection, diff }) => diff[0].kind === 'N' && collection === groupName)
					.length > 0;
			// Has group, but parent is not new, parent is also not being created in this snapshot apply
			if (parentExists && !parentWillBeCreatedInThisApply) return true;

			return false;
		};

		// Create top level collections (no group, or highest level in existing group) first,
		// then continue with nested collections recursively
		await createCollections(snapshotDiff.collections.filter(filterCollectionsForCreation));

		// delete top level collections (no group) first, then continue with nested collections recursively
		await deleteCollections(
			snapshotDiff.collections.filter(
				({ diff }) => diff[0].kind === 'D' && (diff[0] as DiffDeleted<Collection>).lhs.meta?.group === null
			)
		);

		for (const { collection, diff } of snapshotDiff.collections) {
			if (diff?.[0].kind === 'E' || diff?.[0].kind === 'A') {
				const newValues = snapshot.collections.find((field) => {
					return field.collection === collection;
				});

				if (newValues) {
					try {
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
			if (diff?.[0].kind === 'N' && !isNestedMetaUpdate(diff?.[0])) {
				try {
					await fieldsService.createField(collection, (diff[0] as DiffNew<Field>).rhs, undefined, mutationOptions);
				} catch (err) {
					logger.error(`Failed to create field "${collection}.${field}"`);
					throw err;
				}
			}

			if (diff?.[0].kind === 'E' || diff?.[0].kind === 'A' || isNestedMetaUpdate(diff?.[0])) {
				const newValues = snapshot.fields.find((snapshotField) => {
					return snapshotField.collection === collection && snapshotField.field === field;
				});

				if (newValues) {
					try {
						await fieldsService.updateField(
							collection,
							{
								...newValues,
							},
							mutationOptions
						);
					} catch (err) {
						logger.error(`Failed to update field "${collection}.${field}"`);
						throw err;
					}
				}
			}

			if (diff?.[0].kind === 'D' && !isNestedMetaUpdate(diff?.[0])) {
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

			if (diff?.[0].kind === 'N') {
				try {
					await relationsService.createOne((diff[0] as DiffNew<Relation>).rhs, mutationOptions);
				} catch (err) {
					logger.error(`Failed to create relation "${collection}.${field}"`);
					throw err;
				}
			}

			if (diff?.[0].kind === 'E' || diff?.[0].kind === 'A') {
				const newValues = snapshot.relations.find((relation) => {
					return relation.collection === collection && relation.field === field;
				});

				if (newValues) {
					try {
						await relationsService.updateOne(collection, field, newValues, mutationOptions);
					} catch (err) {
						logger.error(`Failed to update relation "${collection}.${field}"`);
						throw err;
					}
				}
			}

			if (diff?.[0].kind === 'D') {
				try {
					await relationsService.deleteOne(collection, field, mutationOptions);
				} catch (err) {
					logger.error(`Failed to delete relation "${collection}.${field}"`);
					throw err;
				}
			}
		}
	});

	await systemCache?.clear();

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
	if (diff.kind !== 'N' && diff.kind !== 'D') return false;
	if (!diff.path || diff.path.length < 2 || diff.path[0] !== 'meta') return false;
	return true;
}
