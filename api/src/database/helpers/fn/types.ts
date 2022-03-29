import { SchemaOverview } from '@directus/shared/types';
import { Knex } from 'knex';
import { DatabaseHelper } from '../types';

export abstract class FnHelper extends DatabaseHelper {
	constructor(protected knex: Knex, protected schema: SchemaOverview) {
		super(knex);
		this.schema = schema;
	}

	abstract year(table: string, column: string): Knex.Raw;
	abstract month(table: string, column: string): Knex.Raw;
	abstract week(table: string, column: string): Knex.Raw;
	abstract day(table: string, column: string): Knex.Raw;
	abstract weekday(table: string, column: string): Knex.Raw;
	abstract hour(table: string, column: string): Knex.Raw;
	abstract minute(table: string, column: string): Knex.Raw;
	abstract second(table: string, column: string): Knex.Raw;
	abstract count(table: string, column: string): Knex.Raw;
}
