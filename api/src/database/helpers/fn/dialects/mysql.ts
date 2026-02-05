import type { Knex } from 'knex';
import { parseJsonFunction } from '../json/parse-function.js';
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

	json(table: string, functionCall: string, options?: FnHelperOptions): Knex.Raw {
		const { field, path, hasWildcard } = parseJsonFunction(functionCall);
		const collectionName = options?.originalCollectionName || table;
		const fieldSchema = this.schema.collections?.[collectionName]?.fields?.[field];

		if (!fieldSchema || fieldSchema.type !== 'json') {
			throw new Error(`Field ${field} is not a JSON field`);
		}

		// Convert dot notation to MySQL JSON path
		// "data.items[0].name" → "$['items'][0]['name']"
		const jsonPath = convertToMySQLPath(path, hasWildcard);

		// For wildcards, JSON_EXTRACT returns a JSON array directly (don't unquote)
		if (hasWildcard) {
			return this.knex.raw(`JSON_EXTRACT(??.??, ?)`, [table, field, jsonPath]);
		}

		return this.knex.raw(`JSON_UNQUOTE(JSON_EXTRACT(??.??, ?))`, [table, field, jsonPath]);
	}
}

/**
 * Split a JSON path string on dots and brackets
 * @example ".items[0].name" → ["items", "0", "name"]
 */
export function splitJsonPath(path: string): string[] {
	const parts: string[] = [];
	let current = '';

	// Skip leading dot if present
	const start = path.startsWith('.') ? 1 : 0;

	for (let i = start; i < path.length; i++) {
		const char = path[i];

		if (char === '.' || char === '[' || char === ']') {
			if (current) {
				parts.push(current);
				current = '';
			}
		} else {
			current += char;
		}
	}

	if (current) {
		parts.push(current);
	}

	return parts;
}

export function convertToMySQLPath(path: string, hasWildcard: boolean = false): string {
	// ".color" → "$['color']" (bracket notation for compatibility)
	// ".items[0].name" → "$['items'][0]['name']"
	// ".items[].name" → "$['items'][*]['name']" (wildcard)

	// For wildcards, convert [] to [*] first
	let processedPath = path;

	if (hasWildcard) {
		processedPath = path.split('[]').join('[*]');
	}

	const parts = splitJsonPath(processedPath);

	let result = '$';

	for (const part of parts) {
		if (part === '*') {
			result += '[*]';
		} else {
			const num = Number(part);

			if (Number.isInteger(num) && num >= 0 && String(num) === part) {
				result += `[${part}]`;
			} else {
				result += `['${part}']`;
			}
		}
	}

	return result;
}
