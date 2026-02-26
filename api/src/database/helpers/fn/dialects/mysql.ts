import { InvalidQueryError } from '@directus/errors';
import type { Knex } from 'knex';
import { toPath } from 'lodash-es';
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

		return this.knex.raw(`JSON_UNQUOTE(JSON_EXTRACT(??.??, ?))`, [table, column, jsonPath]);
	}
}


export function convertToMySQLPath(path: string): string {
	// Use dot notation for object keys (compatible with both MySQL and MariaDB)
	// ".color" → "$.color"
	// ".items[0].name" → "$.items[0].name"
	const parts = toPath(path.startsWith('.') ? path.slice(1) : path);

	let result = '$';

	for (const part of parts) {
		const num = Number(part);

		if (Number.isInteger(num) && num >= 0 && String(num) === part) {
			result += `[${part}]`;
		} else {
			result += `.${part}`;
		}
	}

	return result;
}
