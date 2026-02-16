import type { Relation } from '@directus/types';
import type { Knex } from 'knex';
import type { RelationalJsonContext } from '../../../../types/ast.js';
import { generateRelationalQueryAlias } from '../../../run-ast/utils/generate-alias.js';
import { parseJsonFunction } from '../json/parse-function.js';
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
			const jsonExtraction = this.knex.raw(`json_extract(??, ?)`, [ctx.jsonField, jsonPath]);

			return this._relationalJson(table, ctx, jsonExtraction, options);
		}

		// Direct JSON field access (non-relational)
		const collectionName = options?.originalCollectionName || table;
		const fieldSchema = this.schema.collections?.[collectionName]?.fields?.[field];

		if (!fieldSchema || fieldSchema.type !== 'json') {
			throw new Error(`Field ${field} is not a JSON field`);
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

		const sqliteJsonPath = '$' + context.jsonPath;
		const jsonExtraction = this.knex.raw(`json_extract(??, ?)`, [targetAlias + '.' + context.jsonField, sqliteJsonPath]);

		const isFirstO2M = firstHop.relationType === 'o2m';

		const subQuery = this.knex
			.select(isFirstO2M ? this.knex.raw('json_group_array(?)', [jsonExtraction]) : jsonExtraction)
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
		const sqliteJsonPath = '$' + jsonPath;
		const jsonExtraction = this.knex.raw(`json_extract(??, ?)`, [targetAlias + '.' + jsonField, sqliteJsonPath]);

		const subQuery = this.knex
			.select(this.knex.raw('json_group_array(?)', [jsonExtraction]))
			.from({ [junctionAlias]: junctionCollection! })
			.leftJoin({ [targetAlias]: targetCollection }, (joinClause) => {
				joinClause
					.onVal(`${junctionAlias}.${oneCollectionField!}`, '=', collectionScope!)
					.andOn(
						`${junctionAlias}.${junctionItemField!}`,
						'=',
						this.knex.raw('CAST(??.?? AS TEXT)', [targetAlias, targetPrimary]),
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
