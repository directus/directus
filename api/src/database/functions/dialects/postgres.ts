import { Knex } from 'knex';
import { IBaseHelper } from '../base';

export class HelperPostgres implements IBaseHelper {
	private knex: Knex;

	constructor(knex: Knex) {
		this.knex = knex;
	}

	year(table: string, column: string): Knex.Raw {
		return this.knex.raw('EXTRACT(YEAR FROM ??.??) as ??', [table, column, `${column}_year`]);
	}

	month(table: string, column: string): Knex.Raw {
		return this.knex.raw('EXTRACT(MONTH FROM ??)', [column]);
	}

	week(table: string, column: string): Knex.Raw {
		return this.knex.raw('EXTRACT(WEEK FROM ??)', [column]);
	}

	day(table: string, column: string): Knex.Raw {
		return this.knex.raw('EXTRACT(DAY FROM ??)', [column]);
	}

	weekday(table: string, column: string): Knex.Raw {
		return this.knex.raw('EXTRACT(DOW FROM ??)', [column]);
	}

	hour(table: string, column: string): Knex.Raw {
		return this.knex.raw('EXTRACT(HOUR FROM ??)', [column]);
	}

	minute(table: string, column: string): Knex.Raw {
		return this.knex.raw('EXTRACT(MINUTE FROM ??)', [column]);
	}

	second(table: string, column: string): Knex.Raw {
		return this.knex.raw('EXTRACT(SECOND FROM ??)', [column]);
	}
}
