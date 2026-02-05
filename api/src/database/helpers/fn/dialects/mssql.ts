import type { Relation } from '@directus/types';
import type { Knex } from 'knex';
import { parseJsonFunction, parseWildcardPath } from '../json/parse-function.js';
import type { FnHelperOptions } from '../types.js';
import { FnHelper } from '../types.js';

const parseLocaltime = (columnType?: string) => {
	if (columnType === 'timestamp') {
		return ` AT TIME ZONE 'UTC'`;
	}

	return '';
};

export class FnHelperMSSQL extends FnHelper {
	year(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`DATEPART(year, ??.??${parseLocaltime(options?.type)})`, [table, column]);
	}

	month(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`DATEPART(month, ??.??${parseLocaltime(options?.type)})`, [table, column]);
	}

	week(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`DATEPART(week, ??.??${parseLocaltime(options?.type)})`, [table, column]);
	}

	day(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`DATEPART(day, ??.??${parseLocaltime(options?.type)})`, [table, column]);
	}

	weekday(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`DATEPART(weekday, ??.??${parseLocaltime(options?.type)})`, [table, column]);
	}

	hour(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`DATEPART(hour, ??.??${parseLocaltime(options?.type)})`, [table, column]);
	}

	minute(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`DATEPART(minute, ??.??${parseLocaltime(options?.type)})`, [table, column]);
	}

	second(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`DATEPART(second, ??.??${parseLocaltime(options?.type)})`, [table, column]);
	}

	count(table: string, column: string, options?: FnHelperOptions): Knex.Raw<any> {
		const collectionName = options?.originalCollectionName || table;
		const type = this.schema.collections?.[collectionName]?.fields?.[column]?.type ?? 'unknown';

		if (type === 'json') {
			return this.knex.raw(`(SELECT COUNT(*) FROM OPENJSON(??.??, '$'))`, [table, column]);
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
			const jsonExtraction = this.knex.raw(`JSON_VALUE(??, ?)`, [ctx.jsonField, jsonPath]);

			return this._relationalJson(table, ctx, jsonExtraction, options);
		}

		// Direct JSON field access (non-relational)
		const collectionName = options?.originalCollectionName || table;
		const fieldSchema = this.schema.collections?.[collectionName]?.fields?.[field];

		if (!fieldSchema || fieldSchema.type !== 'json') {
			throw new Error(`Field ${field} is not a JSON field`);
		}

		// Handle array wildcards using OPENJSON with STRING_AGG
		if (hasWildcard) {
			const { arrayPath, valuePath } = parseWildcardPath(path);

			// Use OPENJSON to iterate and JSON_VALUE to extract, wrap in JSON array
			return this.knex.raw(
				`(SELECT '[' + STRING_AGG('"' + STRING_ESCAPE(JSON_VALUE(value, ?), 'json') + '"', ',') + ']' FROM OPENJSON(??.??, ?))`,
				[valuePath, table, field, arrayPath],
			);
		}

		// MSSQL uses JSON_VALUE for scalar values
		// "data.items[0].name" → "$.items[0].name"
		const jsonPath = '$' + path;

		return this.knex.raw(`JSON_VALUE(??.??, ?)`, [table, field, jsonPath]);
	}

	protected _relationalJsonO2M(
		table: string,
		alias: string,
		relation: Relation,
		_targetCollection: string,
		jsonExtraction: Knex.Raw,
		parentPrimary: string,
	): Knex.Raw {
		// MSSQL O2M aggregation using STRING_AGG with JSON wrapper
		// Note: STRING_AGG returns null for empty sets, COALESCE handles that
		const subQuery = this.knex.raw(
			`(SELECT COALESCE('[' + STRING_AGG('"' + STRING_ESCAPE(CAST(? AS NVARCHAR(MAX)), 'json') + '"', ',') + ']', '[]') FROM ?? AS ?? WHERE ??.?? = ??.??)`,
			[jsonExtraction, relation.collection, alias, alias, relation.field, table, parentPrimary],
		);

		return subQuery;
	}
}
