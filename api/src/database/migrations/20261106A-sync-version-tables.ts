import { createInspector } from '@directus/schema';
import type { Knex } from 'knex';
import { partition } from 'lodash-es';
import { isVersionTable } from '../../services/version-tables/constants.js';
import { VersionTablesService } from '../../services/version-tables.js';
import { getSchema } from '../../utils/get-schema.js';

/**
 * Create the shadow and link tables of all versioned collections. Every schema change after this only updates the
 * version tables it affects.
 */
export async function up(knex: Knex): Promise<void> {
	const schema = await getSchema({ database: knex, bypassCache: true });
	const service = new VersionTablesService({ knex, schema });

	const state = await service.readVersioningState();

	if (!state) return;

	// Inspecting the whole database at once is a lot faster than inspecting each table on its own
	const [versionColumns, liveColumns] = partition(await service.schemaInspector.columnInfo(), (column) =>
		isVersionTable(column.table),
	);

	const [versionForeignKeys, liveForeignKeys] = partition(await service.schemaInspector.foreignKeys(), (foreignKey) =>
		isVersionTable(foreignKey.table),
	);

	await service.syncFromSchema({
		versioned: state.versioned,
		existing: { tables: state.versionTables, columns: versionColumns, foreignKeys: versionForeignKeys },
		live: { columns: liveColumns, foreignKeys: liveForeignKeys },
		relationsMeta: await service.readRelationsMeta(),
	});
}

export async function down(knex: Knex): Promise<void> {
	const inspector = createInspector(knex);
	const tables = (await inspector.tables()).filter(isVersionTable);

	// Version tables reference each other, so their foreign keys have to be dropped before the tables
	for (const table of tables) {
		const foreignKeys = await inspector.foreignKeys(table);

		if (foreignKeys.length === 0) continue;

		await knex.schema.alterTable(table, (builder) => {
			for (const foreignKey of foreignKeys) {
				builder.dropForeign(foreignKey.column, foreignKey.constraint_name ?? undefined);
			}
		});
	}

	for (const table of tables) {
		await knex.schema.dropTable(table);
	}
}
