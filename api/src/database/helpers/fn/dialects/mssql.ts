import { FnHelper, FnHelperOptions } from '../types.js';
import type { Knex } from 'knex';

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

	async count(table: string, column: string, options?: FnHelperOptions): Promise<Knex.Raw<any>> {
		const type = (await this.schema.getField(table, column))?.type ?? 'unknown';

		if (type === 'json') {
			return this.knex.raw(`(SELECT COUNT(*) FROM OPENJSON(??.??, '$'))`, [table, column]);
		}

		if (type === 'alias') {
			return await this._relationalCount(table, column, options);
		}

		throw new Error(`Couldn't extract type from ${table}.${column}`);
	}
}
