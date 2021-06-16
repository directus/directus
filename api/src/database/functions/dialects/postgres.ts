import { Knex } from 'knex';
import { HelperFn } from '../types';

export class HelperPostgres implements HelperFn {
	private knex: Knex;

	constructor(knex: Knex) {
		this.knex = knex;
	}

	year(table: string, column: string): Knex.Raw {
		return this.knex.raw('EXTRACT(YEAR FROM ??.??)', [table, column]);
	}

	month(table: string, column: string): Knex.Raw {
		return this.knex.raw('EXTRACT(MONTH FROM ??.??)', [table, column]);
	}

	week(table: string, column: string): Knex.Raw {
		return this.knex.raw('EXTRACT(WEEK FROM ??.??)', [table, column]);
	}

	day(table: string, column: string): Knex.Raw {
		return this.knex.raw('EXTRACT(DAY FROM ??.??)', [table, column]);
	}

	weekday(table: string, column: string): Knex.Raw {
		return this.knex.raw('EXTRACT(DOW FROM ??.??)', [table, column]);
	}

	hour(table: string, column: string): Knex.Raw {
		return this.knex.raw('EXTRACT(HOUR FROM ??.??)', [table, column]);
	}

	minute(table: string, column: string): Knex.Raw {
		return this.knex.raw('EXTRACT(MINUTE FROM ??.??)', [table, column]);
	}

	second(table: string, column: string): Knex.Raw {
		return this.knex.raw('EXTRACT(SECOND FROM ??.??)', [table, column]);
	}
}
