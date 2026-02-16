import type { Relation } from '@directus/types';
import type { Knex } from 'knex';
import type { RelationalJsonContext } from '../../../../types/ast.js';
import { generateRelationalQueryAlias } from '../../../run-ast/utils/generate-alias.js';
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
		const { field, path } = parseJsonFunction(functionCall);

		// Check for relational JSON context (e.g., json(category.metadata, color))
		if (options?.relationalJsonContext) {
			const ctx = options.relationalJsonContext;
			const fieldSchema = this.schema.collections?.[ctx.targetCollection]?.fields?.[ctx.jsonField];

			if (!fieldSchema || fieldSchema.type !== 'json') {
				throw new Error(`Field ${ctx.jsonField} is not a JSON field on ${ctx.targetCollection}`);
			}

			// Build JSON extraction for the subquery
			const jsonPath = convertToMySQLPath(ctx.jsonPath, ctx.hasWildcard);
			const jsonExtraction = this.knex.raw(`JSON_UNQUOTE(JSON_EXTRACT(??, ?))`, [ctx.jsonField, jsonPath]);

			return this._relationalJson(table, ctx, jsonExtraction, options);
		}

		// Direct JSON field access (non-relational)
		const collectionName = options?.originalCollectionName || table;
		const fieldSchema = this.schema.collections?.[collectionName]?.fields?.[field];

		if (!fieldSchema || fieldSchema.type !== 'json') {
			throw new Error(`Field ${field} is not a JSON field`);
		}

		// Convert dot notation to MySQL JSON path
		// "data.items[0].name" → "$['items'][0]['name']"
		const jsonPath = convertToMySQLPath(path);

		return this.knex.raw(`JSON_UNQUOTE(JSON_EXTRACT(??.??, ?))`, [table, field, jsonPath]);
	}

	protected _relationalJsonO2M(
		table: string,
		alias: string,
		relation: Relation,
		_targetCollection: string,
		jsonExtraction: Knex.Raw,
		parentPrimary: string,
	): Knex.Raw {
		// MySQL O2M aggregation using JSON_ARRAYAGG()
		const subQuery = this.knex
			.select(this.knex.raw('JSON_ARRAYAGG(?)', [jsonExtraction]))
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

		const mysqlJsonPath = convertToMySQLPath(context.jsonPath, context.hasWildcard);

		const jsonExtraction = this.knex.raw(`JSON_UNQUOTE(JSON_EXTRACT(??, ?))`, [
			targetAlias + '.' + context.jsonField, mysqlJsonPath,
		]);

		const isFirstO2M = firstHop.relationType === 'o2m';

		const subQuery = this.knex
			.select(isFirstO2M ? this.knex.raw('JSON_ARRAYAGG(?)', [jsonExtraction]) : jsonExtraction)
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
		const mysqlJsonPath = convertToMySQLPath(jsonPath, context.hasWildcard);
		const jsonExtraction = this.knex.raw(`JSON_UNQUOTE(JSON_EXTRACT(??, ?))`, [targetAlias + '.' + jsonField, mysqlJsonPath]);

		const subQuery = this.knex
			.select(this.knex.raw('JSON_ARRAYAGG(?)', [jsonExtraction]))
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
