import { Knex } from 'knex';

export interface HelperFn {
	year(table: string, column: string, alias?: string): Knex.Raw;
	month(table: string, column: string, alias?: string): Knex.Raw;
	week(table: string, column: string, alias?: string): Knex.Raw;
	day(table: string, column: string, alias?: string): Knex.Raw;
	weekday(table: string, column: string, alias?: string): Knex.Raw;
	hour(table: string, column: string, alias?: string): Knex.Raw;
	minute(table: string, column: string, alias?: string): Knex.Raw;
	second(table: string, column: string, alias?: string): Knex.Raw;
}
