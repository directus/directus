import KnexSQLite from 'knex-schema-inspector/dist/dialects/sqlite';
import extractMaxLength from 'knex-schema-inspector/dist/utils/extract-max-length';
import extractType from 'knex-schema-inspector/dist/utils/extract-type';
import { SchemaOverview } from '../types/overview';
import { SchemaInspector } from '../types/schema';
import { stripQuotes } from '../utils/strip-quotes';

type RawColumn = {
	cid: number;
	name: string;
	type: string;
	notnull: 0 | 1;
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
			const columns = await this.knex.raw<RawColumn[]>(`PRAGMA table_info(??)`, table);

			if (table in overview === false) {
				overview[table] = {
					primary: columns.find((column) => column.pk == 1)!.name!,
					columns: {},
				};
			}

			for (const column of columns) {
				overview[table].columns[column.name] = {
					table_name: table,
					column_name: column.name,
					default_value:
						column.pk === 1 && tablesWithAutoIncrementPrimaryKeys.includes(table)
							? 'AUTO_INCREMENT'
							: stripQuotes(column.dflt_value),
					is_nullable: column.notnull == 0,
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
