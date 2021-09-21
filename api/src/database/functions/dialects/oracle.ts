import { Knex } from 'knex';
import { HelperFn } from '../types';

export class HelperOracle implements HelperFn {
	private knex: Knex;

	constructor(knex: Knex) {
		this.knex = knex;
	}

	year(table: string, column: string): Knex.Raw {
		return this.knex.raw("TO_CHAR(??.??, 'IYYY')", [table, column]);
	}

	month(table: string, column: string): Knex.Raw {
		return this.knex.raw("TO_CHAR(??.??, 'MM')", [table, column]);
	}

	week(table: string, column: string): Knex.Raw {
		return this.knex.raw("TO_CHAR(??.??, 'IW')", [table, column]);
	}

	day(table: string, column: string): Knex.Raw {
		return this.knex.raw("TO_CHAR(??.??, 'DD')", [table, column]);
	}

	weekday(table: string, column: string): Knex.Raw {
		return this.knex.raw("TO_CHAR(??.??, 'D')", [table, column]);
	}

	hour(table: string, column: string): Knex.Raw {
		return this.knex.raw("TO_CHAR(??.??, 'HH24')", [table, column]);
	}

	minute(table: string, column: string): Knex.Raw {
		return this.knex.raw("TO_CHAR(??.??, 'MI')", [table, column]);
	}

	second(table: string, column: string): Knex.Raw {
		return this.knex.raw("TO_CHAR(??.??, 'SS')", [table, column]);
	}
}
