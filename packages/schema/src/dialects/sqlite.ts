import KnexSQLite, { parseDefaultValue } from '../lib/dialects/sqlite';
import extractMaxLength from '../lib/utils/extract-max-length';
import extractType from '../lib/utils/extract-type';
import type { SchemaOverview } from '../types/overview.js';
import type { SchemaInspector } from '../types/schema.js';

type RawColumn = {
	cid: number;
	name: string;
	type: string;
	notnull: 0 | 1;
	hidden: 0 | 1 | 2;
	dflt_value: any;
	pk: 0 | 1;
};

export default class SQLite extends KnexSQLite implements SchemaInspector {
	async overview(): Promise<SchemaOverview> {
		const tablesWithAutoIncrementPrimaryKeys = (
			await this.knex.select('name').from('sqlite_master').whereRaw(`sql LIKE "%AUTOINCREMENT%"`)
		).map(({ name }) => name);

		const tables = await this.tables();
		const overview: SchemaOverview = {};

		for (const table of tables) {
			const columns = await this.knex.raw<RawColumn[]>(`PRAGMA table_xinfo(??)`, table);

			if (table in overview === false) {
				const primaryKeys = columns.filter((column) => column.pk !== 0);
				overview[table] = {
					primary: primaryKeys.length !== 1 ? (undefined as any) : primaryKeys[0]!.name!,
					columns: {},
				};
			}

			for (const column of columns) {
				overview[table]!.columns[column.name] = {
					table_name: table,
					column_name: column.name,
					default_value:
						column.pk === 1 && tablesWithAutoIncrementPrimaryKeys.includes(table)
							? 'AUTO_INCREMENT'
							: parseDefaultValue(column.dflt_value),
					is_nullable: column.notnull == 0,
					is_generated: column.hidden !== 0,
					data_type: extractType(column.type),
					max_length: extractMaxLength(column.type),
					numeric_precision: null,
					numeric_scale: null,
				};
			}
		}
		return overview;
	}
}
