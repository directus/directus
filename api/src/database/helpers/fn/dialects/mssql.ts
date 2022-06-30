import { FnHelper } from '../types';
import { Knex } from 'knex';

export class FnHelperMSSQL extends FnHelper {
	year(table: string, column: string): Knex.Raw {
		return this.knex.raw('DATEPART(year, ??.??)', [table, column]);
	}

	month(table: string, column: string): Knex.Raw {
		return this.knex.raw('DATEPART(month, ??.??)', [table, column]);
	}

	week(table: string, column: string): Knex.Raw {
		return this.knex.raw('DATEPART(week, ??.??)', [table, column]);
	}

	day(table: string, column: string): Knex.Raw {
		return this.knex.raw('DATEPART(day, ??.??)', [table, column]);
	}

	weekday(table: string, column: string): Knex.Raw {
		return this.knex.raw('DATEPART(weekday, ??.??)', [table, column]);
	}

	hour(table: string, column: string): Knex.Raw {
		return this.knex.raw('DATEPART(hour, ??.??)', [table, column]);
	}

	minute(table: string, column: string): Knex.Raw {
		return this.knex.raw('DATEPART(minute, ??.??)', [table, column]);
	}

	second(table: string, column: string): Knex.Raw {
		return this.knex.raw('DATEPART(second, ??.??)', [table, column]);
	}

	count(table: string, column: string): Knex.Raw<any> {
		const type = this.schema.collections?.[table]?.fields?.[column]?.type ?? 'unknown';

		if (type === 'json') {
			return this.knex.raw(`(SELECT COUNT(*) FROM OPENJSON(??.??, '$'))`, [table, column]);
		}

		if (type === 'alias') {
			return this._relationalCount(table, column);
		}

		throw new Error(`Couldn't extract type from ${table}.${column}`);
	}
}
