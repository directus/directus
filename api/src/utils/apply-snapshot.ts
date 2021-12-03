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
				await collectionsService.deleteOne(collection);
			}

			if (diff?.[0].kind === 'N' && diff[0].rhs) {
				// We'll nest the to-be-created fields in the same collection creation, to prevent
				// creating a collection without a primary key
				const fields = snapshotDiff.fields
					.filter((fieldDiff) => fieldDiff.collection === collection)
					.map((fieldDiff) => (fieldDiff.diff[0] as DiffNew<Field>).rhs);

				await collectionsService.createOne({
					...diff[0].rhs,
					fields,
				});

				// Now that the fields are in for this collection, we can strip them from the field
				// edits
				snapshotDiff.fields = snapshotDiff.fields.filter((fieldDiff) => fieldDiff.collection !== collection);
			}

			if (diff?.[0].kind === 'E' || diff?.[0].kind === 'A') {
				const newValues = snapshot.collections.find((field) => {
					return field.collection === collection;
				});

				if (newValues) {
					await collectionsService.updateOne(collection, newValues);
				}
			}
		}

		const fieldsService = new FieldsService({ knex: trx, schema: await getSchema({ database: trx }) });

		for (const { collection, field, diff } of snapshotDiff.fields) {
			if (diff?.[0].kind === 'N') {
				await fieldsService.createField(collection, (diff[0] as DiffNew<Field>).rhs);
			}

			if (diff?.[0].kind === 'E' || diff?.[0].kind === 'A') {
				const newValues = snapshot.fields.find((snapshotField) => {
					return snapshotField.collection === collection && snapshotField.field === field;
				});

				if (newValues) {
					await fieldsService.updateField(collection, {
						...newValues,
					});
				}
			}

			if (diff?.[0].kind === 'D') {
				await fieldsService.deleteField(collection, field);

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
				await relationsService.createOne((diff[0] as DiffNew<Relation>).rhs);
			}

			if (diff?.[0].kind === 'E' || diff?.[0].kind === 'A') {
				const newValues = snapshot.relations.find((relation) => {
					return relation.collection === collection && relation.field === field;
				});

				if (newValues) {
					await relationsService.updateOne(collection, field, newValues);
				}
			}

			if (diff?.[0].kind === 'D') {
				await relationsService.deleteOne(collection, field);
			}
		}
	});
}
