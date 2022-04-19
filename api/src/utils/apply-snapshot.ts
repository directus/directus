import { Snapshot, SnapshotDiff, SnapshotField } from '../types';
import { getSnapshot } from './get-snapshot';
import { getSnapshotDiff } from './get-snapshot-diff';
import { Knex } from 'knex';
import getDatabase from '../database';
import { getSchema } from './get-schema';
import { CollectionsService, FieldsService, RelationsService } from '../services';
import { set, merge } from 'lodash';
import { Diff, DiffNew } from 'deep-diff';
import { Field, Relation, SchemaOverview } from '@directus/shared/types';
import logger from '../logger';

export async function applySnapshot(
	snapshot: Snapshot,
	options?: { database?: Knex; schema?: SchemaOverview; current?: Snapshot; diff?: SnapshotDiff }
): Promise<void> {
	const database = options?.database ?? getDatabase();
	const schema = options?.schema ?? (await getSchema({ database }));

	const current = options?.current ?? (await getSnapshot({ database, schema }));
	const snapshotDiff = options?.diff ?? getSnapshotDiff(current, snapshot);

	await database.transaction(async (trx) => {
		const collectionsService = new CollectionsService({ knex: trx, schema });

		for (const { collection, diff } of snapshotDiff.collections) {
			if (diff?.[0].kind === 'D') {
				try {
					await collectionsService.deleteOne(collection);
				} catch (err) {
					logger.error(`Failed to delete collection "${collection}"`);
					throw err;
				}
			}

			if (diff?.[0].kind === 'N' && diff[0].rhs) {
				// We'll nest the to-be-created fields in the same collection creation, to prevent
				// creating a collection without a primary key
				const fields = snapshotDiff.fields
					.filter((fieldDiff) => fieldDiff.collection === collection)
					.map((fieldDiff) => (fieldDiff.diff[0] as DiffNew<Field>).rhs)
					.map((fieldDiff) => {
						// Casts field type to UUID when applying SQLite-based schema on other databases.
						// This is needed because SQLite snapshots UUID fields as char with length 36, and
						// it will fail when trying to create relation between char field to UUID field
						if (
							!fieldDiff.schema ||
							fieldDiff.schema.data_type !== 'char' ||
							fieldDiff.schema.max_length !== 36 ||
							!fieldDiff.schema.foreign_key_table ||
							!fieldDiff.schema.foreign_key_column
						) {
							return fieldDiff;
						}

						const matchingForeignKeyTable = schema.collections[fieldDiff.schema.foreign_key_table];
						if (!matchingForeignKeyTable) return fieldDiff;

						const matchingForeignKeyField = matchingForeignKeyTable.fields[fieldDiff.schema.foreign_key_column];
						if (!matchingForeignKeyField || matchingForeignKeyField.type !== 'uuid') return fieldDiff;

						return merge(fieldDiff, { type: 'uuid', schema: { data_type: 'uuid', max_length: null } });
					});

				try {
					await collectionsService.createOne({
						...diff[0].rhs,
						fields,
					});
				} catch (err: any) {
					logger.error(`Failed to create collection "${collection}"`);
					throw err;
				}

				// Now that the fields are in for this collection, we can strip them from the field
				// edits
				snapshotDiff.fields = snapshotDiff.fields.filter((fieldDiff) => fieldDiff.collection !== collection);
			}

			if (diff?.[0].kind === 'E' || diff?.[0].kind === 'A') {
				const newValues = snapshot.collections.find((field) => {
					return field.collection === collection;
				});

				if (newValues) {
					try {
						await collectionsService.updateOne(collection, newValues);
					} catch (err) {
						logger.error(`Failed to update collection "${collection}"`);
						throw err;
					}
				}
			}
		}

		const fieldsService = new FieldsService({ knex: trx, schema: await getSchema({ database: trx }) });

		for (const { collection, field, diff } of snapshotDiff.fields) {
			if (diff?.[0].kind === 'N' && !isNestedMetaUpdate(diff?.[0])) {
				try {
					await fieldsService.createField(collection, (diff[0] as DiffNew<Field>).rhs);
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
						await fieldsService.updateField(collection, {
							...newValues,
						});
					} catch (err) {
						logger.error(`Failed to update field "${collection}.${field}"`);
						throw err;
					}
				}
			}

			if (diff?.[0].kind === 'D' && !isNestedMetaUpdate(diff?.[0])) {
				try {
					await fieldsService.deleteField(collection, field);
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

		const relationsService = new RelationsService({ knex: trx, schema: await getSchema({ database: trx }) });

		for (const { collection, field, diff } of snapshotDiff.relations) {
			const structure = {};

			for (const diffEdit of diff) {
				set(structure, diffEdit.path!, undefined);
			}

			if (diff?.[0].kind === 'N') {
				try {
					await relationsService.createOne((diff[0] as DiffNew<Relation>).rhs);
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
						await relationsService.updateOne(collection, field, newValues);
					} catch (err) {
						logger.error(`Failed to update relation "${collection}.${field}"`);
						throw err;
					}
				}
			}

			if (diff?.[0].kind === 'D') {
				try {
					await relationsService.deleteOne(collection, field);
				} catch (err) {
					logger.error(`Failed to delete relation "${collection}.${field}"`);
					throw err;
				}
			}
		}
	});
}

export function isNestedMetaUpdate(diff: Diff<SnapshotField | undefined>): boolean {
	if (!diff) return false;
	if (diff.kind !== 'N' && diff.kind !== 'D') return false;
	if (!diff.path || diff.path.length < 2 || diff.path[0] !== 'meta') return false;
	return true;
}
