import { Knex } from 'knex';
import SchemaInspector from 'knex-schema-inspector';
import { schemaInspector } from '..';
import { RelationMeta } from '../../types';

export async function up(knex: Knex): Promise<void> {
	const inspector = SchemaInspector(knex);

	const foreignKeys = await inspector.foreignKeys();
	const relations = await knex
		.select<RelationMeta[]>('many_collection', 'many_field', 'one_collection')
		.from('directus_relations');

	const constraintsToAdd = relations.filter((relation) => {
		const exists = !!foreignKeys.find(
			(fk) => fk.table === relation?.many_collection && fk.column === relation?.many_field
		);
		return exists === false;
	});

	await knex.transaction(async (trx) => {
		for (const constraint of constraintsToAdd) {
			if (!constraint.one_collection) continue;

			const currentPrimaryKeyField = await schemaInspector.primary(constraint.many_collection);
			const relatedPrimaryKeyField = await schemaInspector.primary(constraint.one_collection);
			if (!currentPrimaryKeyField || !relatedPrimaryKeyField) continue;

			const rowsWithIllegalFKValues = await trx
				.select(`${constraint.many_collection}.${currentPrimaryKeyField}`)
				.from(constraint.many_collection)
				.leftJoin(
					constraint.one_collection,
					`${constraint.many_collection}.${constraint.many_field}`,
					`${constraint.one_collection}.${relatedPrimaryKeyField}`
				)
				.whereNull(`${constraint.one_collection}.${relatedPrimaryKeyField}`);

			if (rowsWithIllegalFKValues.length > 0) {
				const ids: (string | number)[] = rowsWithIllegalFKValues.map<string | number>(
					(row) => row[currentPrimaryKeyField]
				);

				await trx(constraint.many_collection)
					.update({ [constraint.many_field]: null })
					.whereIn(currentPrimaryKeyField, ids);
			}

			// Can't reliably have circular cascade
			const action = constraint.many_collection === constraint.one_collection ? 'NO ACTION' : 'SET NULL';

			// MySQL doesn't accept FKs from `int` to `int unsigned`. `knex` defaults `.increments()`
			// to `unsigned`, but defaults `.integer()` to `int`. This means that created m2o fields
			// have the wrong type. This step will force the m2o `int` field into `unsigned`, but only
			// if both types are integers, and only if we go from `int` to `int unsigned`.
			const columnInfo = await schemaInspector.columnInfo(constraint.many_collection, constraint.many_field);
			const relatedColumnInfo = await schemaInspector.columnInfo(constraint.one_collection!, relatedPrimaryKeyField);

			await trx.schema.alterTable(constraint.many_collection, (table) => {
				if (
					columnInfo.data_type !== relatedColumnInfo.data_type &&
					columnInfo.data_type === 'int' &&
					relatedColumnInfo.data_type === 'int unsigned'
				) {
					table.specificType(constraint.many_field, 'int unsigned').alter();
				}

				table
					.foreign(constraint.many_field)
					.references(relatedPrimaryKeyField)
					.inTable(constraint.one_collection!)
					.onDelete(action);
			});
		}
	});
}

export async function down(knex: Knex): Promise<void> {
	const relations = await knex.select<RelationMeta[]>('many_collection', 'many_field').from('directus_relations');
	for (const relation of relations) {
		await knex.schema.alterTable(relation.many_collection, (table) => {
			table.dropForeign([relation.many_field]);
		});
	}
}
