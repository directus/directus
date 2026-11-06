import { createInspector } from '@directus/schema';
import type { Knex } from 'knex';
import { isVersionTable } from '../../services/version-tables/constants.js';
import { VersionTablesService } from '../../services/version-tables.js';
import { getSchema } from '../../utils/get-schema.js';

/**
 * Create the shadow and link tables of all versioned collections. Every schema change after this only updates the
 * version tables it affects.
 */
export async function up(knex: Knex): Promise<void> {
	const schema = await getSchema({ database: knex, bypassCache: true });

	await new VersionTablesService({ knex, schema }).sync();
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
