import { Query, SchemaOverview } from '@directus/shared/types';
import { Knex } from 'knex';
import { applyFilter } from '../../../utils/apply-query';
import { DatabaseHelper } from '../types';

export type FnHelperOptions = {
	type?: string;
	query?: Query;
};

export abstract class FnHelper extends DatabaseHelper {
	constructor(protected knex: Knex, protected schema: SchemaOverview) {
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
		const relation = this.schema.relations.find(
			(relation) => relation.related_collection === table && relation?.meta?.one_field === column
		);

		const currentPrimary = this.schema.collections[table].primary;

		if (!relation) {
			throw new Error(`Field ${table}.${column} isn't a nested relational collection`);
		}

		let countQuery = this.knex
			.count('*')
			.from(relation.collection)
			.where(relation.field, '=', this.knex.raw(`??.??`, [table, currentPrimary]));

		if (options?.query?.filter) {
			countQuery = applyFilter(this.knex, this.schema, countQuery, options.query.filter, relation.collection, false);
		}

		return this.knex.raw('(' + countQuery.toQuery() + ')');
	}
}
