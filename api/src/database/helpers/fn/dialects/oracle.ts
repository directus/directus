import { FnHelper, FnHelperOptions } from '../types';
import { Knex } from 'knex';

const parseLocaltime = (columnType?: string) => {
	if (columnType === 'timestamp') {
		return ` AT TIME ZONE 'UTC'`;
	}
	return '';
};

export class FnHelperOracle extends FnHelper {
	year(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`TO_CHAR(??.??${parseLocaltime(options?.type)}, 'IYYY')`, [table, column]);
	}

	month(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`TO_CHAR(??.??${parseLocaltime(options?.type)}, 'MM')`, [table, column]);
	}

	week(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`TO_CHAR(??.??${parseLocaltime(options?.type)}, 'IW')`, [table, column]);
	}

	day(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`TO_CHAR(??.??${parseLocaltime(options?.type)}, 'DD')`, [table, column]);
	}

	weekday(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`TO_CHAR(??.??${parseLocaltime(options?.type)}, 'D')`, [table, column]);
	}

	hour(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`TO_CHAR(??.??${parseLocaltime(options?.type)}, 'HH24')`, [table, column]);
	}

	minute(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`TO_CHAR(??.??${parseLocaltime(options?.type)}, 'MI')`, [table, column]);
	}

	second(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`TO_CHAR(??.??${parseLocaltime(options?.type)}, 'SS')`, [table, column]);
	}

	count(table: string, column: string, options?: FnHelperOptions): Knex.Raw<any> {
		const collectionName = options?.originalCollectionName || table;
		const type = this.schema.collections?.[collectionName]?.fields?.[column]?.type ?? 'unknown';

		if (type === 'json') {
			return this.knex.raw("json_value(??.??, '$.size()')", [table, column]);
		}

		if (type === 'alias') {
			return this._relationalCount(table, column, options);
		}

		throw new Error(`Couldn't extract type from ${table}.${column}`);
	}
}
