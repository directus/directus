import { FnHelper, FnHelperOptions } from '../types.js';
import type { Knex } from 'knex';

export class FnHelperPostgres extends FnHelper {
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

	async count(table: string, column: string, options?: FnHelperOptions): Promise<Knex.Raw> {
		const type = (await this.schema.getField(table, column))?.type ?? 'unknown';

		if (type === 'json') {
			const { dbType } = await this.schema.getField(table, column) ?? {};

			return this.knex.raw(dbType === 'jsonb' ? 'jsonb_array_length(??.??)' : 'json_array_length(??.??)', [
				table,
				column,
			]);
		}

		if (type === 'alias') {
			return await this._relationalCount(table, column, options);
		}

		throw new Error(`Couldn't extract type from ${table}.${column}`);
	}
}
