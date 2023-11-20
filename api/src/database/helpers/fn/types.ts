import type { Query, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { applyFilter } from '../../../utils/apply-query.js';
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

		let countQuery = this.knex
			.count('*')
			.from(relation.collection)
			.where(relation.field, '=', this.knex.raw(`??.??`, [table, currentPrimary]));

		if (options?.query?.filter) {
			countQuery = applyFilter(this.knex, this.schema, countQuery, options.query.filter, relation.collection, {}).query;
		}

		return this.knex.raw('(' + countQuery.toQuery() + ')');
	}
}
