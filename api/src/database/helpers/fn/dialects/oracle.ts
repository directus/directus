import { FnHelper } from '../types';
import { Knex } from 'knex';

export class FnHelperOracle extends FnHelper {
	year(table: string, column: string): Knex.Raw {
		return this.knex.raw("TO_CHAR(??.??, 'IYYY')", [table, column]);
	}

	month(table: string, column: string): Knex.Raw {
		return this.knex.raw("TO_CHAR(??.??, 'MM')", [table, column]);
	}

	week(table: string, column: string): Knex.Raw {
		return this.knex.raw("TO_CHAR(??.??, 'IW')", [table, column]);
	}

	day(table: string, column: string): Knex.Raw {
		return this.knex.raw("TO_CHAR(??.??, 'DD')", [table, column]);
	}

	weekday(table: string, column: string): Knex.Raw {
		return this.knex.raw("TO_CHAR(??.??, 'D')", [table, column]);
	}

	hour(table: string, column: string): Knex.Raw {
		return this.knex.raw("TO_CHAR(??.??, 'HH24')", [table, column]);
	}

	minute(table: string, column: string): Knex.Raw {
		return this.knex.raw("TO_CHAR(??.??, 'MI')", [table, column]);
	}

	second(table: string, column: string): Knex.Raw {
		return this.knex.raw("TO_CHAR(??.??, 'SS')", [table, column]);
	}

	count(table: string, column: string): Knex.Raw<any> {
		const type = this.schema.collections?.[table]?.fields?.[column]?.type ?? 'unknown';

		if (type === 'json') {
			return this.knex.raw("json_value(??.??, '$.size()')", [table, column]);
		}

		if (type === 'alias') {
			return this._relationalCount(table, column);
		}

		throw new Error(`Couldn't extract type from ${table}.${column}`);
	}
}
