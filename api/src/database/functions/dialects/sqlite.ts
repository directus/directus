import { Knex } from 'knex';
import { HelperFn } from '../types';

export class HelperSQLite implements HelperFn {
	private knex: Knex;

	constructor(knex: Knex) {
		this.knex = knex;
	}

	year(table: string, column: string): Knex.Raw {
		return this.knex.raw("strftime('%Y', ??.??)", [table, column]);
	}

	month(table: string, column: string): Knex.Raw {
		return this.knex.raw("strftime('%m', ??.??)", [table, column]);
	}

	week(table: string, column: string): Knex.Raw {
		return this.knex.raw("strftime('%W', ??.??)", [table, column]);
	}

	day(table: string, column: string): Knex.Raw {
		return this.knex.raw("strftime('%d', ??.??)", [table, column]);
	}

	weekday(table: string, column: string): Knex.Raw {
		return this.knex.raw("strftime('%w', ??.??)", [table, column]);
	}

	hour(table: string, column: string): Knex.Raw {
		return this.knex.raw("strftime('%H', ??.??)", [table, column]);
	}

	minute(table: string, column: string): Knex.Raw {
		return this.knex.raw("strftime('%M', ??.??)", [table, column]);
	}

	second(table: string, column: string): Knex.Raw {
		return this.knex.raw("strftime('%S', ??.??)", [table, column]);
	}
}
