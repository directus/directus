import type { Query, SchemaOverview } from '@directus/shared/types';
import type { Knex } from 'knex';
import { applyFilter } from '../../../utils/apply-query.js';
import { DatabaseHelper } from '../types.js';

export type FnHelperOptions = {
	type?: string;
	query?: Query;
};

export abstract class FnHelper extends DatabaseHelper {
	constructor(protected override knex: Knex, protected schema: SchemaOverview) {
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
	abstract count(table: string, column: string, options?: FnHelperOptions): Promise<Knex.Raw>;

	protected async _relationalCount(table: string, column: string, options?: FnHelperOptions): Promise<Knex.Raw> {
		const relation = (await this.schema.getRelations()).find(
			(relation) => relation.related_collection === table && relation?.meta?.one_field === column
		);

		const currentPrimary = (await this.schema.getCollection(table))!.primary;

		if (!relation) {
			throw new Error(`Field ${table}.${column} isn't a nested relational collection`);
		}

		let countQuery = this.knex
			.count('*')
			.from(relation.collection)
			.where(relation.field, '=', this.knex.raw(`??.??`, [table, currentPrimary]));

		if (options?.query?.filter) {
			countQuery = await applyFilter(this.knex, this.schema, countQuery, options.query.filter, relation.collection, false);
		}

		return this.knex.raw('(' + countQuery.toQuery() + ')');
	}
}
