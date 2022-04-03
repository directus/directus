import { FnHelper } from '../types';
import { Knex } from 'knex';

export class FnHelperSQLite extends FnHelper {
	year(table: string, column: string): Knex.Raw {
		return this.knex.raw("CAST(strftime('%Y', ??.?? / 1000, 'unixepoch') AS INTEGER)", [table, column]);
	}

	month(table: string, column: string): Knex.Raw {
		return this.knex.raw("CAST(strftime('%m', ??.?? / 1000, 'unixepoch') AS INTEGER)", [table, column]);
	}

	week(table: string, column: string): Knex.Raw {
		return this.knex.raw("CAST(strftime('%W', ??.?? / 1000, 'unixepoch') AS INTEGER)", [table, column]);
	}

	day(table: string, column: string): Knex.Raw {
		return this.knex.raw("CAST(strftime('%d', ??.?? / 1000, 'unixepoch') AS INTEGER)", [table, column]);
	}

	weekday(table: string, column: string): Knex.Raw {
		return this.knex.raw("CAST(strftime('%w', ??.?? / 1000, 'unixepoch') AS INTEGER)", [table, column]);
	}

	hour(table: string, column: string): Knex.Raw {
		return this.knex.raw("CAST(strftime('%H', ??.?? / 1000, 'unixepoch') AS INTEGER)", [table, column]);
	}

	minute(table: string, column: string): Knex.Raw {
		return this.knex.raw("CAST(strftime('%M', ??.?? / 1000, 'unixepoch') AS INTEGER)", [table, column]);
	}

	second(table: string, column: string): Knex.Raw {
		return this.knex.raw("CAST(strftime('%S', ??.?? / 1000, 'unixepoch') AS INTEGER)", [table, column]);
	}

	count(table: string, column: string): Knex.Raw<any> {
		const type = this.schema.collections?.[table]?.fields?.[column]?.type ?? 'unknown';

		if (type === 'json') {
			return this.knex.raw(`json_array_length(??.??, '$')`, [table, column]);
		}

		if (type === 'alias') {
			return this._relationalCount(table, column);
		}

		throw new Error(`Couldn't extract type from ${table}.${column}`);
	}
}
