import type { Query, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { applyFilter, generateAlias } from '../../../utils/apply-query.js';
import type { AliasMap } from '../../../utils/get-column-path.js';
import { DatabaseHelper } from '../types.js';

export type FnHelperOptions = {
	type: string | undefined;
	query: Query | undefined;
	originalCollectionName: string | undefined;
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
		const alias = generateAlias();

		let countQuery = this.knex
			.count('*')
			.from({ [alias]: relation.collection })
			.where(this.knex.raw(`??.??`, [alias, relation.field]), '=', this.knex.raw(`??.??`, [table, currentPrimary]));

		if (options?.query?.filter) {
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
				options.query.filter,
				relation.collection,
				aliasMap,
			).query;
		}

		return this.knex.raw('(' + countQuery.toQuery() + ')');
	}
}
