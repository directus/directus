import { Snapshot, SnapshotDiff, SchemaOverview, Relation } from '../types';
import { getSnapshot } from './get-snapshot';
import { getSnapshotDiff } from './get-snapshot-diff';
import { Knex } from 'knex';
import getDatabase from '../database';
import { getSchema } from './get-schema';
import { CollectionsService, FieldsService, RelationsService } from '../services';
import { set } from 'lodash';
import { DiffNew } from 'deep-diff';
import { Field } from '@directus/shared/types';
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
					.map((fieldDiff) => (fieldDiff.diff[0] as DiffNew<Field>).rhs);

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
			if (diff?.[0].kind === 'N') {
				try {
					await fieldsService.createField(collection, (diff[0] as DiffNew<Field>).rhs);
				} catch (err) {
					logger.error(`Failed to create field "${collection}.${field}"`);
					throw err;
				}
			}

			if (diff?.[0].kind === 'E' || diff?.[0].kind === 'A') {
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

			if (diff?.[0].kind === 'D') {
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
