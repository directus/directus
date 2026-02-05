import type { Filter, Permission, Query, Relation, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import type { RelationalJsonContext } from '../../../types/ast.js';
import type { AliasMap } from '../../../utils/get-column-path.js';
import { applyFilter } from '../../run-ast/lib/apply-query/filter/index.js';
import { generateRelationalQueryAlias } from '../../run-ast/utils/generate-alias.js';
import { DatabaseHelper } from '../types.js';

export type FnHelperOptions = {
	type: string | undefined;
	originalCollectionName: string | undefined;
	relationalCountOptions:
		| {
				query: Query;
				cases: Filter[];
				permissions: Permission[];
		  }
		| undefined;
	/** Context for relational JSON access, passed from FunctionFieldNode */
	relationalJsonContext?: RelationalJsonContext;
};

export abstract class FnHelper extends DatabaseHelper {
	constructor(
		knex: Knex,
		protected schema: SchemaOverview,
	) {
		super(knex);
		this.schema = schema;
	}

	abstract year(table: string, column: string, options?: FnHelperOptions): Knex.Raw;
	abstract month(table: string, column: string, options?: FnHelperOptions): Knex.Raw;
	abstract week(table: string, column: string, options?: FnHelperOptions): Knex.Raw;
	abstract day(table: string, column: string, options?: FnHelperOptions): Knex.Raw;
	abstract weekday(table: string, column: string, options?: FnHelperOptions): Knex.Raw;
	abstract hour(table: string, column: string, options?: FnHelperOptions): Knex.Raw;
	abstract minute(table: string, column: string, options?: FnHelperOptions): Knex.Raw;
	abstract second(table: string, column: string, options?: FnHelperOptions): Knex.Raw;
	abstract count(table: string, column: string, options?: FnHelperOptions): Knex.Raw;
	abstract json(table: string, functionCall: string, options?: FnHelperOptions): Knex.Raw;

	protected _relationalCount(table: string, column: string, options?: FnHelperOptions): Knex.Raw {
		const collectionName = options?.originalCollectionName || table;

		const relation = this.schema.relations.find(
			(relation) => relation.related_collection === collectionName && relation?.meta?.one_field === column,
		);

		const currentPrimary = this.schema.collections[collectionName]!.primary;

		if (!relation) {
			throw new Error(`Field ${collectionName}.${column} isn't a nested relational collection`);
		}

		// generate a unique alias for the relation collection, to prevent collisions in self referencing relations
		const alias = generateRelationalQueryAlias(table, column, collectionName, options);

		let countQuery = this.knex
			.count('*')
			.from({ [alias]: relation.collection })
			.where(this.knex.raw(`??.??`, [alias, relation.field]), '=', this.knex.raw(`??.??`, [table, currentPrimary]));

		if (options?.relationalCountOptions?.query.filter) {
			// set the newly aliased collection in the alias map as the default parent collection, indicated by '', for any nested filters
			const aliasMap: AliasMap = {
				'': {
					alias,
					collection: relation.collection,
				},
			};

			countQuery = applyFilter(
				this.knex,
				this.schema,
				countQuery,
				options.relationalCountOptions.query.filter,
				relation.collection,
				aliasMap,
				options.relationalCountOptions.cases,
				options.relationalCountOptions.permissions,
			).query;
		}

		return this.knex.raw('(' + countQuery.toQuery() + ')');
	}

	/**
	 * Generates a correlated subquery for extracting JSON values from related collections.
	 * Follows the same pattern as _relationalCount() but applies JSON extraction.
	 *
	 * @param table - The parent table name (with any aliases)
	 * @param context - The relational JSON context from FunctionFieldNode
	 * @param jsonExtraction - Dialect-specific Knex.Raw for JSON extraction (e.g., metadata::jsonb->>'color')
	 * @param options - Function helper options
	 */
	protected _relationalJson(
		table: string,
		context: RelationalJsonContext,
		jsonExtraction: Knex.Raw,
		options?: FnHelperOptions,
	): Knex.Raw {
		const collectionName = options?.originalCollectionName || table;
		const { relation, relationType, targetCollection, relationalPath } = context;

		const currentPrimary = this.schema.collections[collectionName]!.primary;
		const targetPrimary = this.schema.collections[targetCollection]!.primary;

		// Generate unique alias for the subquery to prevent collisions
		const alias = generateRelationalQueryAlias(table, relationalPath.join('.'), collectionName, options);

		if (relationType === 'm2o') {
			// M2O: Single value - the parent table has the FK pointing to the related table
			// Example: products.category_id -> categories.id
			// Subquery: (SELECT metadata->>'color' FROM categories WHERE categories.id = products.category_id LIMIT 1)
			const subQuery = this.knex
				.select(jsonExtraction)
				.from({ [alias]: targetCollection })
				.where(
					this.knex.raw('??.??', [alias, targetPrimary]),
					'=',
					this.knex.raw('??.??', [table, relation.field]),
				)
				.limit(1);

			return this.knex.raw('(' + subQuery.toQuery() + ')');
		} else {
			// O2M: Multiple values - the related table has the FK pointing back to parent
			// Example: articles.id <- comments.article_id
			// Delegates to dialect-specific aggregation (json_agg, JSON_ARRAYAGG, etc.)
			return this._relationalJsonO2M(table, alias, relation, targetCollection, jsonExtraction, currentPrimary);
		}
	}

	/**
	 * Abstract method for O2M JSON aggregation. Each dialect must implement this
	 * to use its native JSON array aggregation function.
	 *
	 * @param table - The parent table name
	 * @param alias - The generated alias for the subquery
	 * @param relation - The relation object with FK info
	 * @param targetCollection - The related collection containing the JSON field
	 * @param jsonExtraction - Dialect-specific JSON extraction expression
	 * @param parentPrimary - The primary key field of the parent table
	 */
	protected abstract _relationalJsonO2M(
		table: string,
		alias: string,
		relation: Relation,
		targetCollection: string,
		jsonExtraction: Knex.Raw,
		parentPrimary: string,
	): Knex.Raw;
}
