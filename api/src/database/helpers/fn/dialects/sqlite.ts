import type { Relation } from '@directus/types';
import type { Knex } from 'knex';
import { parseJsonFunction, parseWildcardPath } from '../json/parse-function.js';
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
		const { field, path, hasWildcard } = parseJsonFunction(functionCall);

		// Check for relational JSON context (e.g., json(category.metadata:color))
		if (options?.relationalJsonContext) {
			const ctx = options.relationalJsonContext;
			const fieldSchema = this.schema.collections?.[ctx.targetCollection]?.fields?.[ctx.jsonField];

			if (!fieldSchema || fieldSchema.type !== 'json') {
				throw new Error(`Field ${ctx.jsonField} is not a JSON field on ${ctx.targetCollection}`);
			}

			// Build JSON extraction for the subquery
			const jsonPath = '$' + ctx.jsonPath;
			const jsonExtraction = this.knex.raw(`json_extract(??, ?)`, [ctx.jsonField, jsonPath]);

			return this._relationalJson(table, ctx, jsonExtraction, options);
		}

		// Direct JSON field access (non-relational)
		const collectionName = options?.originalCollectionName || table;
		const fieldSchema = this.schema.collections?.[collectionName]?.fields?.[field];

		if (!fieldSchema || fieldSchema.type !== 'json') {
			throw new Error(`Field ${field} is not a JSON field`);
		}

		// Handle array wildcards - SQLite requires json_each/json_group_array
		if (hasWildcard) {
			const { arrayPath, valuePath } = parseWildcardPath(path);

			return this.knex.raw(`(SELECT json_group_array(json_extract(value, ?)) FROM json_each(??.??, ?))`, [
				valuePath,
				table,
				field,
				arrayPath,
			]);
		}

		// SQLite uses json_extract with $ path notation
		// "data.items[0].name" → "$.items[0].name"
		const jsonPath = '$' + path;

		return this.knex.raw(`json_extract(??.??, ?)`, [table, field, jsonPath]);
	}

	protected _relationalJsonO2M(
		table: string,
		alias: string,
		relation: Relation,
		_targetCollection: string,
		jsonExtraction: Knex.Raw,
		parentPrimary: string,
	): Knex.Raw {
		// SQLite O2M aggregation using json_group_array()
		const subQuery = this.knex
			.select(this.knex.raw('json_group_array(?)', [jsonExtraction]))
			.from({ [alias]: relation.collection })
			.where(this.knex.raw('??.??', [alias, relation.field]), '=', this.knex.raw('??.??', [table, parentPrimary]));

		return this.knex.raw('(' + subQuery.toQuery() + ')');
	}
}
