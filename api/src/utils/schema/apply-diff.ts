import type { ActionEventParams, Field, MutationOptions, RawField, Relation, SchemaOverview, Snapshot, SnapshotCollection, SnapshotDiff, SnapshotField } from '@directus/types';
import { DiffKind } from '@directus/types';
import type { Diff, DiffDeleted, DiffNew } from 'deep-diff';
import deepDiff from 'deep-diff';
import type { Knex } from 'knex';
import { cloneDeep, merge, set } from 'lodash-es';
import { flushCaches } from '../../cache.js';
import { getHelpers } from '../../database/helpers/index.js';
import getDatabase from '../../database/index.js';
import emitter from '../../emitter.js';
import { useLogger } from '../../logger/index.js';
import { CollectionsService } from '../../services/collections.js';
import { FieldsService } from '../../services/fields.js';
import { RelationsService } from '../../services/relations.js';
import type { Collection } from '../../types/index.js';
import { getSchema } from '../get-schema.js';
import { transaction } from '../transaction.js';

type CollectionDelta = {
	collection: string;
	diff: Diff<Collection>[];
};

const logger = useLogger();

export async function applyDiff(
	currentSnapshot: Snapshot,
	snapshotDiff: SnapshotDiff,
	options?: { database?: Knex; schema?: SchemaOverview },
): Promise<void> {
	const database = options?.database ?? getDatabase();
	const schema = options?.schema ?? (await getSchema({ database }));

	const nestedActionEvents: ActionEventParams[] = [];

	const collectionsService = new CollectionsService({
		knex: database,
		schema,
	});

	const fieldsService = new FieldsService({
		knex: database,
		schema,
	});

	const relationsService = new RelationsService({
		knex: database,
		schema,
	});

	const mutationOptions: MutationOptions = {
		bypassEmitAction: (params) => nestedActionEvents.push(params),
		autoPurgeCache: false,
		autoPurgeSystemCache: false,
	};

	await transaction(database, async (database) => {
		const getNestedCollectionsToCreate = (currentLevelCollection: string) =>
			snapshotDiff.collections.filter(
				({ diff }) => (diff[0] as DiffNew<Collection>).rhs?.meta?.group === currentLevelCollection,
			) as CollectionDelta[];

		const createCollections = async (collections: CollectionDelta[]) => {
			for (const { collection, diff } of collections) {
				if (diff?.[0]?.kind === DiffKind.NEW && diff[0].rhs) {
					// We'll nest the to-be-created fields in the same collection creation, to prevent
					// "table doesn't exist" errors when creating fields before the collection exists
					const fields = snapshotDiff.fields
						.filter((field) => field.collection === collection)
						.map((field) => (field.diff[0] as DiffNew<RawField>).rhs)
						.filter((field) => field !== undefined) as RawField[];

					await collectionsService.createOne(
						{
							...diff[0].rhs,
							fields,
						},
						mutationOptions,
					);

					// Recurse for nested collections within this group
					const nestedCollections = getNestedCollectionsToCreate(collection);

					if (nestedCollections.length > 0) {
						await createCollections(nestedCollections);
					}
				}
			}
		};

		const deleteCollections = async (collections: CollectionDelta[]) => {
			for (const { collection, diff } of collections) {
				if (diff?.[0]?.kind === DiffKind.DELETE && !isNestedMetaUpdate(diff?.[0])) {
					const relations = schema.relations.filter(
						(relation) => relation.collection === collection || relation.related_collection === collection,
					);

					for (const relation of relations) {
						await relationsService.deleteField(relation.collection, relation.field, mutationOptions);
					}

					await collectionsService.deleteOne(collection, mutationOptions);
				}
			}
		};

		// 1. Create collections
		const rootCollectionsToCreate = snapshotDiff.collections.filter(({ diff }) => {
			if (diff.length === 0 || diff[0] === undefined) return false;
			const collectionDiff = diff[0] as DiffNew<Collection>;

			if (collectionDiff.kind !== DiffKind.NEW || !collectionDiff.rhs) return false;

			const groupName = collectionDiff.rhs.meta?.group;
			if (!groupName) return true;

			const parentWillBeCreatedInThisApply =
				snapshotDiff.collections.filter(
					({ collection, diff }) => diff[0]?.kind === DiffKind.NEW && collection === groupName,
				).length > 0;

			return !parentWillBeCreatedInThisApply;
		});

		if (rootCollectionsToCreate.length > 0) await createCollections(rootCollectionsToCreate);

		// 2. Delete collections
		const collectionsToDelete = snapshotDiff.collections.filter(({ diff }) => {
			if (diff.length === 0 || diff[0] === undefined) return false;
			const collectionDiff = diff[0] as DiffDeleted<Collection>;
			return collectionDiff.kind === DiffKind.DELETE && !isNestedMetaUpdate(collectionDiff);
		});

		if (collectionsToDelete.length > 0) await deleteCollections(collectionsToDelete);

		// 3. Update collections
		for (const { collection, diff } of snapshotDiff.collections) {
			if (diff?.[0]?.kind === DiffKind.EDIT || diff?.[0]?.kind === DiffKind.ARRAY || isNestedMetaUpdate(diff[0]!)) {
				const currentCollection = currentSnapshot.collections.find((field) => {
					return field.collection === collection;
				});

				if (currentCollection) {
					const updatedCollection = cloneDeep(currentCollection);

					for (const change of diff) {
						if (change.path) {
							set(updatedCollection, change.path, (change as any).rhs);
						}
					}

					await collectionsService.updateOne(collection, updatedCollection, mutationOptions);
				} else {
					logger.warn(`Collection "${collection}" not found in current snapshot. Skipping update.`);
				}
			}
		}

		// 4. Create fields
		for (const { collection, field, diff } of snapshotDiff.fields) {
			if (diff?.[0]?.kind === DiffKind.NEW && !isNestedMetaUpdate(diff?.[0])) {
				try {
					await fieldsService.createField(collection, diff[0].rhs, undefined, mutationOptions);
				} catch (err) {
					logger.warn(`Failed to create field "${field}" in collection "${collection}"`);
					throw err;
				}
			}
		}

		// 5. Delete fields
		for (const { collection, field, diff } of snapshotDiff.fields) {
			if (diff?.[0]?.kind === DiffKind.DELETE && !isNestedMetaUpdate(diff?.[0])) {
				await fieldsService.deleteField(collection, field, mutationOptions);
			}
		}

		// 6. Update fields
		for (const { collection, field, diff } of snapshotDiff.fields) {
			if (diff?.[0]?.kind === DiffKind.EDIT || diff?.[0]?.kind === DiffKind.ARRAY || isNestedMetaUpdate(diff[0]!)) {
				const currentField = currentSnapshot.fields.find((snapshotField) => {
					return snapshotField.collection === collection && snapshotField.field === field;
				});

				if (currentField) {
					const updatedField = cloneDeep(currentField);

					for (const change of diff) {
						if (change.path) {
							if (change.kind === DiffKind.DELETE) {
								const pathParent = change.path.slice(0, -1);
								const pathKey = change.path[change.path.length - 1]!;
								const parentObj = pathParent.length > 0 ? (updatedField as any)[pathParent.join('.')] : updatedField;

								if (parentObj && typeof parentObj === 'object') {
									delete parentObj[pathKey];
								}
							} else {
								set(updatedField, change.path, (change as any).rhs);
							}
						}
					}

					await fieldsService.updateField(collection, updatedField, mutationOptions);
				} else {
					logger.warn(`Field "${field}" in collection "${collection}" not found in current snapshot. Skipping update.`);
				}
			}
		}

		// 7. System fields
		for (const { collection, field, diff } of snapshotDiff.systemFields) {
			const currentSystemField = (currentSnapshot.systemFields ?? []).find((snapshotSystemField) => {
				return snapshotSystemField.collection === collection && snapshotSystemField.field === field;
			});

			if (currentSystemField) {
				const updatedSystemField = cloneDeep(currentSystemField);

				for (const change of diff) {
					if (change.path) {
						set(updatedSystemField, change.path, (change as any).rhs);
					}
				}

				await fieldsService.updateField(
					collection,
					updatedSystemField as Field,
					mutationOptions,

					// Bypass limits and disable cache auto-purge so column types can be compared directly
					{ bypassLimits: true, autoPurgeSystemCache: false },
				);
			} else {
				logger.warn(
					`System field "${field}" in collection "${collection}" not found in current snapshot. Skipping update.`,
				);
			}
		}

		// 8. Create relations
		for (const { diff } of snapshotDiff.relations) {
			if (diff?.[0]?.kind === DiffKind.NEW) {
				const helpers = getHelpers(database);
				const relation = cloneDeep(diff[0].rhs);

				helpers.schema.processRelationOnDelete(relation);

				await relationsService.createOne(relation, mutationOptions);
			}
		}

		// 9. Delete relations
		for (const { collection, field, diff } of snapshotDiff.relations) {
			if (diff?.[0]?.kind === DiffKind.DELETE) {
				await relationsService.deleteField(collection, field, mutationOptions);
			}
		}

		// 10. Update relations
		for (const { collection, field, diff } of snapshotDiff.relations) {
			if (diff?.[0]?.kind === DiffKind.EDIT || diff?.[0]?.kind === DiffKind.ARRAY) {
				const currentRelation = currentSnapshot.relations.find((relation) => {
					return relation.collection === collection && relation.field === field;
				});

				if (currentRelation) {
					const updatedRelation = cloneDeep(currentRelation);

					for (const change of diff) {
						if (change.path) {
							set(updatedRelation, change.path, (change as any).rhs);
						}
					}

					await relationsService.updateOne(collection, field, updatedRelation, mutationOptions);
				} else {
					logger.warn(
						`Relation for field "${field}" in collection "${collection}" not found in current snapshot. Skipping update.`,
					);
				}
			}
		}
	});

	for (const nestedActionEvent of nestedActionEvents) {
		emitter.emitAction(nestedActionEvent.event, nestedActionEvent.meta, nestedActionEvent.context);
	}

	await flushCaches();
}

export function isNestedMetaUpdate(diff: Diff<SnapshotField | SnapshotCollection | undefined>): boolean {
	if (!diff) return false;
	if (diff.kind !== DiffKind.NEW && diff.kind !== DiffKind.DELETE) return false;
	if (!diff.path || diff.path.length < 2 || diff.path[0] !== 'meta') return false;
	return true;
}
