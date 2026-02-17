import type { Knex } from 'knex';
import { parseJsonFunction } from '../json/parse-function.js';
import type { FnHelperOptions } from '../types.js';
import { FnHelper } from '../types.js';

const parseLocaltime = (columnType?: string) => {
	if (columnType === 'timestamp') {
		return ` AT TIME ZONE 'UTC'`;
	}

	return '';
};

export class FnHelperPostgres extends FnHelper {
	year(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`EXTRACT(YEAR FROM ??.??${parseLocaltime(options?.type)})`, [table, column]);
	}

	month(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`EXTRACT(MONTH FROM ??.??${parseLocaltime(options?.type)})`, [table, column]);
	}

	week(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`EXTRACT(WEEK FROM ??.??${parseLocaltime(options?.type)})`, [table, column]);
	}

	day(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`EXTRACT(DAY FROM ??.??${parseLocaltime(options?.type)})`, [table, column]);
	}

	weekday(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`EXTRACT(DOW FROM ??.??${parseLocaltime(options?.type)})`, [table, column]);
	}

	hour(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`EXTRACT(HOUR FROM ??.??${parseLocaltime(options?.type)})`, [table, column]);
	}

	minute(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`EXTRACT(MINUTE FROM ??.??${parseLocaltime(options?.type)})`, [table, column]);
	}

	second(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`EXTRACT(SECOND FROM ??.??${parseLocaltime(options?.type)})`, [table, column]);
	}

	count(table: string, column: string, options?: FnHelperOptions): Knex.Raw {
		const collectionName = options?.originalCollectionName || table;
		const type = this.schema.collections?.[collectionName]?.fields?.[column]?.type ?? 'unknown';

		if (type === 'json') {
			const { dbType } = this.schema.collections[table]!.fields[column]!;

			return this.knex.raw(dbType === 'jsonb' ? 'jsonb_array_length(??.??)' : 'json_array_length(??.??)', [
				table,
				column,
			]);
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
			throw new Error(`${collectionName}.${field} is not a JSON field`);
		}

		const { dbType } = fieldSchema;
		const { template, bindings } = buildPostgresJsonPath(path);
		const cast = dbType === 'jsonb' ? 'jsonb' : 'json';

		return this.knex.raw(`??::${cast}${template}`, [table + '.' + field, ...bindings]);
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

/**
 * Build a parameterized PostgreSQL JSON path using -> and ->> operators.
 * Returns a template string containing only operators and ? placeholders,
 * plus a bindings array with the actual values.
 *
 * @example ".color" → { template: "->>?", bindings: ["color"] }
 * @example ".items[0].name" → { template: "->?->?->>?", bindings: ["items", 0, "name"] }
 */
export function buildPostgresJsonPath(path: string): { template: string; bindings: (string | number)[] } {
	const parts = splitJsonPath(path);

	let template = '';
	const bindings: (string | number)[] = [];

	for (let i = 0; i < parts.length; i++) {
		const isLast = i === parts.length - 1;
		const num = Number(parts[i]);

		template += (isLast ? '->>' : '->') + '?';

		if (!isNaN(num) && num >= 0 && Number.isInteger(num)) {
			bindings.push(num);
		} else {
			bindings.push(parts[i]!);
		}
	}

	return { template, bindings };
}
