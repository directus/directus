import { FnHelper } from '../types';
import { Knex } from 'knex';

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

	count(table: string, column: string): Knex.Raw {
		const type = this.schema.collections?.[table]?.fields?.[column]?.type ?? 'unknown';

		if (type === 'json') {
			const { dbType } = this.schema.collections[table].fields[column];

			return this.knex.raw(dbType === 'jsonb' ? 'jsonb_array_length(??.??)' : 'json_array_length(??.??)', [
				table,
				column,
			]);
		}

		if (type === 'alias') {
			return this._relationalCount(table, column);
		}

		throw new Error(`Couldn't extract type from ${table}.${column}`);
	}
}
