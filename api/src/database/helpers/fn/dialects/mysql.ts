import { InvalidQueryError } from '@directus/errors';
import type { Knex } from 'knex';
import { convertToMySQLPath } from '../json/mysql-json-path.js';
import type { FnHelperOptions } from '../types.js';
import { FnHelper } from '../types.js';

export class FnHelperMySQL extends FnHelper {
	year(table: string, column: string): Knex.Raw {
		return this.knex.raw('YEAR(??.??)', [table, column]);
	}

	month(table: string, column: string): Knex.Raw {
		return this.knex.raw('MONTH(??.??)', [table, column]);
	}

	week(table: string, column: string): Knex.Raw {
		return this.knex.raw('WEEK(??.??)', [table, column]);
	}

	day(table: string, column: string): Knex.Raw {
		return this.knex.raw('DAYOFMONTH(??.??)', [table, column]);
	}

	weekday(table: string, column: string): Knex.Raw {
		return this.knex.raw('DAYOFWEEK(??.??)', [table, column]);
	}

	hour(table: string, column: string): Knex.Raw {
		return this.knex.raw('HOUR(??.??)', [table, column]);
	}

	minute(table: string, column: string): Knex.Raw {
		return this.knex.raw('MINUTE(??.??)', [table, column]);
	}

	second(table: string, column: string): Knex.Raw {
		return this.knex.raw('SECOND(??.??)', [table, column]);
	}

	count(table: string, column: string, options?: FnHelperOptions): Knex.Raw {
		const collectionName = options?.originalCollectionName || table;
		const type = this.schema.collections?.[collectionName]?.fields?.[column]?.type ?? 'unknown';

		if (type === 'json') {
			return this.knex.raw('JSON_LENGTH(??.??)', [table, column]);
		}

		if (type === 'alias') {
			return this._relationalCount(table, column, options);
		}

		throw new Error(`Couldn't extract type from ${table}.${column}`);
	}

	json(table: string, column: string, options?: FnHelperOptions): Knex.Raw {
		const collectionName = options?.originalCollectionName || table;
		const fieldSchema = this.schema.collections?.[collectionName]?.fields?.[column];

		if (!fieldSchema || fieldSchema.type !== 'json' || !options?.jsonPath) {
			throw new InvalidQueryError({ reason: `${collectionName}.${column} is not a JSON field` });
		}

		// Convert dot notation to MySQL JSON path
		// ".items[0].name" → "$['items'][0]['name']"
		const jsonPath = convertToMySQLPath(options.jsonPath);

		if (options?.forNumericFilter) {
			// JSON_EXTRACT preserves the native numeric type from the JSON document.
			// JSON_UNQUOTE would convert it to a string, breaking numeric comparisons.
			return this.knex.raw(`JSON_EXTRACT(??.??, ?)`, [table, column, jsonPath]);
		}

		return this.knex.raw(`JSON_UNQUOTE(JSON_EXTRACT(??.??, ?))`, [table, column, jsonPath]);
	}
}
