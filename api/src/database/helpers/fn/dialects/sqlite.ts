import { FnHelper } from '../types';
import { Knex } from 'knex';

export class FnHelperSQLite extends FnHelper {
	year(table: string, column: string): Knex.Raw {
		return this.knex.raw("strftime('%Y', ??.?? / 1000, 'unixepoch')", [table, column]);
	}

	month(table: string, column: string): Knex.Raw {
		return this.knex.raw("strftime('%m', ??.?? / 1000, 'unixepoch')", [table, column]);
	}

	week(table: string, column: string): Knex.Raw {
		return this.knex.raw("strftime('%W', ??.?? / 1000, 'unixepoch')", [table, column]);
	}

	day(table: string, column: string): Knex.Raw {
		return this.knex.raw("strftime('%d', ??.?? / 1000, 'unixepoch')", [table, column]);
	}

	weekday(table: string, column: string): Knex.Raw {
		return this.knex.raw("strftime('%w', ??.?? / 1000, 'unixepoch')", [table, column]);
	}

	hour(table: string, column: string): Knex.Raw {
		return this.knex.raw("strftime('%H', ??.?? / 1000, 'unixepoch')", [table, column]);
	}

	minute(table: string, column: string): Knex.Raw {
		return this.knex.raw("strftime('%M', ??.?? / 1000, 'unixepoch')", [table, column]);
	}

	second(table: string, column: string): Knex.Raw {
		return this.knex.raw("strftime('%S', ??.?? / 1000, 'unixepoch')", [table, column]);
	}
}
