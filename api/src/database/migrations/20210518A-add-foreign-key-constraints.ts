import { createInspector } from '@directus/schema';
import type { RelationMeta } from '@directus/types';
import type { Knex } from 'knex';
import { useLogger } from '../../logger.js';
import { getDefaultIndexName } from '../../utils/get-default-index-name.js';

export async function up(knex: Knex): Promise<void> {
	const logger = useLogger();

	const inspector = createInspector(knex);

	const foreignKeys = await inspector.foreignKeys();

	const relations = await knex
		.select<RelationMeta[]>('id', 'many_collection', 'many_field', 'one_collection')
		.from('directus_relations');

	const constraintsToAdd = relations.filter((relation) => {
		const exists = !!foreignKeys.find(
			(fk) => fk.table === relation?.many_collection && fk.column === relation?.many_field,
		);

		return exists === false;
	});

	const corruptedRelations: number[] = [];

	for (const constraint of constraintsToAdd) {
		if (!constraint.one_collection) continue;

		if (
			(await inspector.hasTable(constraint.many_collection)) === false ||
			(await inspector.hasTable(constraint.one_collection)) === false
		) {
			logger.warn(
				`Ignoring ${constraint.many_collection}.${constraint.many_field}<->${constraint.one_collection}. Tables don't exist.`,
			);

			corruptedRelations.push(constraint.id);
			continue;
		}

		const currentPrimaryKeyField = await inspector.primary(constraint.many_collection);
		const relatedPrimaryKeyField = await inspector.primary(constraint.one_collection);

		if (constraint.many_field === currentPrimaryKeyField) {
			logger.warn(
				`Illegal relationship ${constraint.many_collection}.${constraint.many_field}<->${constraint.one_collection} encountered. Many field equals collections primary key.`,
			);

			corruptedRelations.push(constraint.id);
			continue;
		}

		if (!currentPrimaryKeyField || !relatedPrimaryKeyField) continue;

		const rowsWithIllegalFKValues = await knex
			.select(`main.${currentPrimaryKeyField}`)
			.from({ main: constraint.many_collection })
			.leftJoin(
				{ related: constraint.one_collection },
				`main.${constraint.many_field}`,
				`related.${relatedPrimaryKeyField}`,
			)
			.whereNull(`related.${relatedPrimaryKeyField}`);

		if (rowsWithIllegalFKValues.length > 0) {
			const ids: (string | number)[] = rowsWithIllegalFKValues.map<string | number>(
				(row) => row[currentPrimaryKeyField],
			);

			try {
				await knex(constraint.many_collection)
					.update({ [constraint.many_field]: null })
					.whereIn(currentPrimaryKeyField, ids);
			} catch (err: any) {
				logger.error(
					`${constraint.many_collection}.${constraint.many_field} contains illegal foreign keys which couldn't be set to NULL. Please fix these references and rerun this migration to complete the upgrade.`,
				);

				if (ids.length < 25) {
					logger.error(`Items with illegal foreign keys: ${ids.join(', ')}`);
				} else {
					logger.error(`Items with illegal foreign keys: ${ids.slice(0, 25).join(', ')} and ${ids.length} others`);
				}

				throw 'Migration aborted';
			}
		}

		// MySQL doesn't accept FKs from `int` to `int unsigned`. `knex` defaults `.increments()`
		// to `unsigned`, but defaults `.integer()` to `int`. This means that created m2o fields
		// have the wrong type. This step will force the m2o `int` field into `unsigned`, but only
		// if both types are integers, and only if we go from `int` to `int unsigned`.
		const columnInfo = await inspector.columnInfo(constraint.many_collection, constraint.many_field);
		const relatedColumnInfo = await inspector.columnInfo(constraint.one_collection!, relatedPrimaryKeyField);

		try {
			await knex.schema.alterTable(constraint.many_collection, (table) => {
				if (
					columnInfo.data_type !== relatedColumnInfo.data_type &&
					columnInfo.data_type === 'int' &&
					relatedColumnInfo.data_type === 'int unsigned'
				) {
					table.specificType(constraint.many_field, 'int unsigned').alter();
				}

				const indexName = getDefaultIndexName('foreign', constraint.many_collection, constraint.many_field);

				const builder = table
					.foreign(constraint.many_field, indexName)
					.references(relatedPrimaryKeyField)
					.inTable(constraint.one_collection!);

				// Can't reliably have circular cascade
				if (constraint.many_collection !== constraint.one_collection) {
					builder.onDelete('SET NULL');
				}
			});
		} catch (err: any) {
			logger.warn(
				`Couldn't add foreign key constraint for ${constraint.many_collection}.${constraint.many_field}<->${constraint.one_collection}`,
			);

			logger.warn(err);
		}
	}

	if (corruptedRelations.length > 0) {
		logger.warn(
			`Encountered one or more corrupted relationships. Please check the following rows in "directus_relations": ${corruptedRelations.join(
				', ',
			)}`,
		);
	}
}

export async function down(knex: Knex): Promise<void> {
	const logger = useLogger();

	const relations = await knex
		.select<RelationMeta[]>('many_collection', 'many_field', 'one_collection')
		.from('directus_relations');

	for (const relation of relations) {
		if (!relation.one_collection) continue;

		try {
			await knex.schema.alterTable(relation.many_collection, (table) => {
				table.dropForeign([relation.many_field]);
			});
		} catch (err: any) {
			logger.warn(
				`Couldn't drop foreign key constraint for ${relation.many_collection}.${relation.many_field}<->${relation.one_collection}`,
			);

			logger.warn(err);
		}
	}
}
