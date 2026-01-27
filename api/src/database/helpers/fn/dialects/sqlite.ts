import type { Knex } from 'knex';
import { parseJsonFunction } from '../json/parse-function.js';
import type { FnHelperOptions } from '../types.js';
import { FnHelper } from '../types.js';

const parseLocaltime = (columnType?: string) => {
	if (columnType === 'timestamp') {
		return '';
	}

	return `, 'localtime'`;
};

export class FnHelperSQLite extends FnHelper {
	year(table: string, column: string, options?: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`CAST(strftime('%Y', ??.?? / 1000, 'unixepoch'${parseLocaltime(options?.type)}) AS INTEGER)`, [
			table,
			column,
		]);
	}

	month(table: string, column: string, options?: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`CAST(strftime('%m', ??.?? / 1000, 'unixepoch'${parseLocaltime(options?.type)}) AS INTEGER)`, [
			table,
			column,
		]);
	}

	week(table: string, column: string, options?: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`CAST(strftime('%W', ??.?? / 1000, 'unixepoch'${parseLocaltime(options?.type)}) AS INTEGER)`, [
			table,
			column,
		]);
	}

	day(table: string, column: string, options?: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`CAST(strftime('%d', ??.?? / 1000, 'unixepoch'${parseLocaltime(options?.type)}) AS INTEGER)`, [
			table,
			column,
		]);
	}

	weekday(table: string, column: string, options?: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`CAST(strftime('%w', ??.?? / 1000, 'unixepoch'${parseLocaltime(options?.type)}) AS INTEGER)`, [
			table,
			column,
		]);
	}

	hour(table: string, column: string, options?: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`CAST(strftime('%H', ??.?? / 1000, 'unixepoch'${parseLocaltime(options?.type)}) AS INTEGER)`, [
			table,
			column,
		]);
	}

	minute(table: string, column: string, options?: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`CAST(strftime('%M', ??.?? / 1000, 'unixepoch'${parseLocaltime(options?.type)}) AS INTEGER)`, [
			table,
			column,
		]);
	}

	second(table: string, column: string, options?: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`CAST(strftime('%S', ??.?? / 1000, 'unixepoch'${parseLocaltime(options?.type)}) AS INTEGER)`, [
			table,
			column,
		]);
	}

	count(table: string, column: string, options?: FnHelperOptions): Knex.Raw<any> {
		const collectionName = options?.originalCollectionName || table;
		const type = this.schema.collections?.[collectionName]?.fields?.[column]?.type ?? 'unknown';

		if (type === 'json') {
			return this.knex.raw(`json_array_length(??.??, '$')`, [table, column]);
		}

		if (type === 'alias') {
			return this._relationalCount(table, column, options);
		}

		throw new Error(`Couldn't extract type from ${table}.${column}`);
	}

	json(table: string, functionCall: string, options?: FnHelperOptions): Knex.Raw {
		const { field, path } = parseJsonFunction(functionCall);
		const collectionName = options?.originalCollectionName || table;
		const fieldSchema = this.schema.collections?.[collectionName]?.fields?.[field];

		if (!fieldSchema || fieldSchema.type !== 'json') {
			throw new Error(`Field ${field} is not a JSON field`);
		}

		// SQLite uses json_extract with $ path notation
		// "data.items[0].name" → "$.items[0].name"
		const jsonPath = '$' + path;

		return this.knex.raw(`json_extract(??.??, ?)`, [table, field, jsonPath]);
	}
}
