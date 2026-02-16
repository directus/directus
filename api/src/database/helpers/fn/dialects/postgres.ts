import type { Relation } from '@directus/types';
import type { Knex } from 'knex';
import type { RelationalJsonContext } from '../../../../types/ast.js';
import { generateRelationalQueryAlias } from '../../../run-ast/utils/generate-alias.js';
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

		// Check for relational JSON context (e.g., json(category.metadata, color))
		if (options?.relationalJsonContext) {
			const ctx = options.relationalJsonContext;
			const fieldSchema = this.schema.collections?.[ctx.targetCollection]?.fields?.[ctx.jsonField];

			if (!fieldSchema || fieldSchema.type !== 'json') {
				throw new Error(`Field ${ctx.jsonField} is not a JSON field on ${ctx.targetCollection}`);
			}

			const { dbType } = fieldSchema;

			// Build JSON extraction for the aliased table in the subquery
			// The alias will be applied by _relationalJson
			const jsonPath = convertToPostgresPath(ctx.jsonPath);
			
			const jsonExtraction =
				dbType === 'jsonb'
					? this.knex.raw(`??::jsonb${jsonPath}`, [ctx.jsonField])
					: this.knex.raw(`??::json${jsonPath}`, [ctx.jsonField]);

			return this._relationalJson(table, ctx, jsonExtraction, options);
		}

		// Direct JSON field access (non-relational)
		const collectionName = options?.originalCollectionName || table;
		const fieldSchema = this.schema.collections?.[collectionName]?.fields?.[field];

		if (!fieldSchema || fieldSchema.type !== 'json') {
			throw new Error(`Field ${field} is not a JSON field`);
		}

		const { dbType } = fieldSchema;

		// Convert dot notation to PostgreSQL JSON path
		// "data.items[0].name" → "data"->'items'->0->>'name'
		const jsonPath = convertToPostgresPath(path);

		// Use JSONB operators for JSONB fields, JSON functions for JSON fields
		if (dbType === 'jsonb') {
			return this.knex.raw(`??::jsonb${jsonPath}`, [table + '.' + field]);
		} else {
			return this.knex.raw(`??::json${jsonPath}`, [table + '.' + field]);
		}
	}

	protected _relationalJsonO2M(
		table: string,
		alias: string,
		relation: Relation,
		_targetCollection: string,
		jsonExtraction: Knex.Raw,
		parentPrimary: string,
	): Knex.Raw {
		// PostgreSQL O2M aggregation using json_agg()
		// Example: (SELECT json_agg(metadata->>'type') FROM comments AS abc WHERE abc.article_id = articles.id)
		const subQuery = this.knex
			.select(this.knex.raw('json_agg(?)', [jsonExtraction]))
			.from({ [alias]: relation.collection })
			.where(this.knex.raw('??.??', [alias, relation.field]), '=', this.knex.raw('??.??', [table, parentPrimary]));

		return this.knex.raw('(' + subQuery.toQuery() + ')');
	}

	protected _relationalJsonMultiHop(
		table: string,
		context: RelationalJsonContext,
		options?: FnHelperOptions,
	): Knex.Raw {
		const collectionName = options?.originalCollectionName || table;
		const parentPrimary = this.schema.collections[collectionName]!.primary;
		const targetPrimary = this.schema.collections[context.targetCollection]!.primary;
		const chain = context.relationChain!;
		const firstHop = chain[0]!;
		const lastHop = chain[chain.length - 1]!;

		const junctionCollection =
			firstHop.relationType === 'o2m' ? firstHop.relation.collection : firstHop.relation.related_collection!;

		const junctionAlias = generateRelationalQueryAlias(
			table, context.relationalPath.join('.') + '_j', collectionName, options,
		);

		const targetAlias = generateRelationalQueryAlias(
			table, context.relationalPath.join('.') + '_t', collectionName, options,
		);

		const fieldSchema = this.schema.collections?.[context.targetCollection]?.fields?.[context.jsonField];
		const jsonPath = convertToPostgresPath(context.jsonPath);

		const jsonExtraction =
			fieldSchema?.dbType === 'jsonb'
				? this.knex.raw(`??::jsonb${jsonPath}`, [targetAlias + '.' + context.jsonField])
				: this.knex.raw(`??::json${jsonPath}`, [targetAlias + '.' + context.jsonField]);

		const isFirstO2M = firstHop.relationType === 'o2m';

		const subQuery = this.knex
			.select(isFirstO2M ? this.knex.raw('json_agg(?)', [jsonExtraction]) : jsonExtraction)
			.from({ [junctionAlias]: junctionCollection })
			.innerJoin(
				{ [targetAlias]: context.targetCollection },
				`${targetAlias}.${targetPrimary}`,
				`${junctionAlias}.${lastHop.relation.field}`,
			)
			.where(
				this.knex.raw('??.??', [
					junctionAlias,
					isFirstO2M ? firstHop.relation.field : this.schema.collections[junctionCollection]!.primary,
				]),
				'=',
				this.knex.raw('??.??', [table, isFirstO2M ? parentPrimary : firstHop.relation.field]),
			);

		if (!isFirstO2M) {
			subQuery.limit(1);
		}

		return this.knex.raw('(' + subQuery.toQuery() + ')');
	}

	protected _relationalJsonA2O(
		table: string,
		context: RelationalJsonContext,
		options?: FnHelperOptions,
	): Knex.Raw {
		const collectionName = options?.originalCollectionName || table;
		const parentPrimary = this.schema.collections[collectionName]!.primary;
		const targetPrimary = this.schema.collections[context.targetCollection]!.primary;

		const {
			junctionCollection,
			junctionItemField,
			junctionParentField,
			oneCollectionField,
			collectionScope,
			targetCollection,
			jsonField,
			jsonPath,
			relationalPath,
		} = context;

		const junctionAlias = generateRelationalQueryAlias(table, relationalPath.join('.') + '_j', collectionName, options);
		const targetAlias = generateRelationalQueryAlias(table, relationalPath.join('.') + '_t', collectionName, options);

		// Build qualified JSON extraction for the target table
		const fieldSchema = this.schema.collections?.[targetCollection]?.fields?.[jsonField];
		const pgJsonPath = convertToPostgresPath(jsonPath);

		const jsonExtraction =
			fieldSchema?.dbType === 'jsonb'
				? this.knex.raw(`??::jsonb${pgJsonPath}`, [targetAlias + '.' + jsonField])
				: this.knex.raw(`??::json${pgJsonPath}`, [targetAlias + '.' + jsonField]);

		const subQuery = this.knex
			.select(this.knex.raw('json_agg(?)', [jsonExtraction]))
			.from({ [junctionAlias]: junctionCollection! })
			.leftJoin({ [targetAlias]: targetCollection }, (joinClause) => {
				joinClause
					.onVal(`${junctionAlias}.${oneCollectionField!}`, '=', collectionScope!)
					.andOn(
						`${junctionAlias}.${junctionItemField!}`,
						'=',
						this.knex.raw('CAST(??.?? AS CHAR(255))', [targetAlias, targetPrimary]),
					);
			})
			.where(
				this.knex.raw('??.??', [junctionAlias, junctionParentField!]),
				'=',
				this.knex.raw('??.??', [table, parentPrimary]),
			)
			.andWhere(this.knex.raw('??.??', [junctionAlias, oneCollectionField!]), '=', collectionScope!);

		return this.knex.raw('(' + subQuery.toQuery() + ')');
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

export function convertToPostgresPath(path: string): string {
	// ".color" → "->>'color'"
	// ".items[0].name" → "->'items'->0->>'name'"
	// Use ->> for final element (returns text), -> for intermediate (returns json)

	const parts = splitJsonPath(path);

	let result = '';

	for (let i = 0; i < parts.length; i++) {
		const isLast = i === parts.length - 1;
		const num = Number(parts[i]);

		if (!isNaN(num) && num >= 0 && Number.isInteger(num)) {
			result += (isLast ? '->>' : '->') + parts[i];
		} else {
			result += (isLast ? '->>' : '->') + `'${parts[i]}'`;
		}
	}

	return result;
}

export function convertToJsonPathExpr(path: string): string {
	// Convert ".items[].name" → "$.items[*].name"
	// Convert "[].name" → "$[*].name"
	// PostgreSQL jsonb_path_query_array uses SQL/JSON path syntax
	let result = '$' + path; // ".items" → "$.items", "[0]" → "$[0]"
	result = result.split('[]').join('[*]'); // Replace [] with [*]
	return result;
}
