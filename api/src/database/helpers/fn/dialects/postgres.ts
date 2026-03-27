import { InvalidQueryError } from '@directus/errors';
import type { Knex } from 'knex';
import { buildPostgresJsonPath } from '../json/postgres-json-path.js';
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

	// The pg driver automatically deserializes json/jsonb columns, so no string parsing needed.
	override parseJsonResult(value: unknown): unknown {
		return value;
	}

	json(table: string, column: string, options?: FnHelperOptions): Knex.Raw {
		const collectionName = options?.originalCollectionName || table;
		const fieldSchema = this.schema.collections?.[collectionName]?.fields?.[column];

		if (!fieldSchema || fieldSchema.type !== 'json' || !options?.jsonPath) {
			throw new InvalidQueryError({ reason: `${collectionName}.${column} is not a JSON field` });
		}

		const { template, bindings } = buildPostgresJsonPath(options.jsonPath, options.jsonFilter);
		const cast = fieldSchema.dbType === 'jsonb' ? 'jsonb' : 'json';

		if (options.castNumeric) {
			// ->> returns text; cast to numeric for correct numeric comparisons.
			// Parentheses are required to bind ::numeric to the whole expression,
			// not to the last path binding.
			return this.knex.raw(`(??::${cast}${template})::numeric`, [table + '.' + column, ...bindings]);
		}

		return this.knex.raw(`??::${cast}${template}`, [table + '.' + column, ...bindings]);
	}
}
