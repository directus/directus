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

export class FnHelperOracle extends FnHelper {
	year(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`TO_CHAR(??.??${parseLocaltime(options?.type)}, 'IYYY')`, [table, column]);
	}

	month(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`TO_CHAR(??.??${parseLocaltime(options?.type)}, 'MM')`, [table, column]);
	}

	week(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`TO_CHAR(??.??${parseLocaltime(options?.type)}, 'IW')`, [table, column]);
	}

	day(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`TO_CHAR(??.??${parseLocaltime(options?.type)}, 'DD')`, [table, column]);
	}

	weekday(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`TO_CHAR(??.??${parseLocaltime(options?.type)}, 'D')`, [table, column]);
	}

	hour(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`TO_CHAR(??.??${parseLocaltime(options?.type)}, 'HH24')`, [table, column]);
	}

	minute(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`TO_CHAR(??.??${parseLocaltime(options?.type)}, 'MI')`, [table, column]);
	}

	second(table: string, column: string, options: FnHelperOptions): Knex.Raw {
		return this.knex.raw(`TO_CHAR(??.??${parseLocaltime(options?.type)}, 'SS')`, [table, column]);
	}

	count(table: string, column: string, options?: FnHelperOptions): Knex.Raw<any> {
		const collectionName = options?.originalCollectionName || table;
		const type = this.schema.collections?.[collectionName]?.fields?.[column]?.type ?? 'unknown';

		if (type === 'json') {
			return this.knex.raw("json_value(??.??, '$.size()')", [table, column]);
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

		// Oracle uses JSON_VALUE or JSON_QUERY
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
		// Oracle O2M aggregation using JSON_ARRAYAGG()
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

		const oracleJsonPath = '$' + context.jsonPath;
		const jsonExtraction = this.knex.raw(`JSON_VALUE(??.??, ?)`, [targetAlias, context.jsonField, oracleJsonPath]);

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

		// Build Oracle JSON extraction for the target table
		const oracleJsonPath = '$' + jsonPath;

		const subQuery = this.knex
			.select(this.knex.raw('JSON_ARRAYAGG(JSON_VALUE(??.??, ?))', [targetAlias, jsonField, oracleJsonPath]))
			.from({ [junctionAlias]: junctionCollection! })
			.leftJoin({ [targetAlias]: targetCollection }, (joinClause) => {
				joinClause
					.onVal(`${junctionAlias}.${oneCollectionField!}`, '=', collectionScope!)
					.andOn(
						`${junctionAlias}.${junctionItemField!}`,
						'=',
						this.knex.raw('TO_CHAR(??.??)', [targetAlias, targetPrimary]),
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
