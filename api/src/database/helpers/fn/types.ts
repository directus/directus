import type { AliasMap } from '../../../utils/get-column-path.js';
import { applyFilter } from '../../run-ast/lib/apply-query/filter/index.js';
import { generateRelationalQueryAlias } from '../../run-ast/utils/generate-alias.js';
import { DatabaseHelper } from '../types.js';
import type { Filter, Permission, Query, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';

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
}
