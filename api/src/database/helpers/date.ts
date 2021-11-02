import { Knex } from 'knex';
import getDatabase from '..';

let dateHelper: KnexDate | undefined;

export function getDateHelper(): KnexDate {
	if (!dateHelper) {
		const db = getDatabase();
		const client = db.client.config.client as string;
		const constructor = {
			mysql: KnexDate,
			mariadb: KnexDate,
			sqlite3: KnexDate_SQLITE,
			pg: KnexDate,
			postgres: KnexDate,
			redshift: KnexDate,
			mssql: KnexDate,
			oracledb: KnexDate,
		}[client];
		if (!constructor) {
			throw new Error(`Geometry helper not implemented on ${client}.`);
		}
		dateHelper = new constructor(db);
	}
	return dateHelper;
}

class KnexDate {
	constructor(protected knex: Knex) {}

	parseDate(date: string): string {
		return date;
	}
}

class KnexDate_SQLITE extends KnexDate {
	parseDate(date: string): string {
		const newDate = new Date(date);
		return (newDate.getTime() - newDate.getTimezoneOffset() * 60 * 1000).toString();
	}
}
