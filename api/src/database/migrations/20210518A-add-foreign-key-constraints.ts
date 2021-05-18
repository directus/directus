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

	for (const constraint of constraintsToAdd) {
		if (!constraint.one_collection) continue;

		const relatedPrimary = await schemaInspector.primary(constraint.one_collection);

		if (!relatedPrimary) continue;

		// Can't reliably have circular cascade
		const action = constraint.many_collection === constraint.one_collection ? 'NO ACTION' : 'SET NULL';

		await knex.schema.alterTable(constraint.many_collection, (table) => {
			table
				.foreign(constraint.many_field)
				.references(relatedPrimary)
				.inTable(constraint.one_collection!)
				.onDelete(action);
		});
	}
}

export async function down(knex: Knex): Promise<void> {
	const relations = await knex.select<RelationMeta[]>('many_collection', 'many_field').from('directus_relations');
	for (const relation of relations) {
		await knex.schema.alterTable(relation.many_collection, (table) => {
			table.dropForeign([relation.many_field]);
		});
	}
}
