import { Knex } from 'knex';
import getDatabase from '..';

let dateHelper: KnexSpatial | undefined;

export function getDateHelper(): KnexSpatial {
	if (!dateHelper) {
		const db = getDatabase();
		const client = db.client.config.client as string;
		const constructor = {
			mysql: KnexSpatial,
			mariadb: KnexSpatial,
			sqlite3: KnexSpatial_SQLITE,
			pg: KnexSpatial,
			postgres: KnexSpatial,
			redshift: KnexSpatial,
			mssql: KnexSpatial,
			oracledb: KnexSpatial,
		}[client];
		if (!constructor) {
			throw new Error(`Geometry helper not implemented on ${client}.`);
		}
		dateHelper = new constructor(db);
	}
	return dateHelper;
}

class KnexSpatial {
	constructor(protected knex: Knex) {}

	parseDate(date: string): string {
		return date;
	}
}

class KnexSpatial_SQLITE extends KnexSpatial {
	parseDate(date: string): string {
		const newDate = new Date(date);
		return (newDate.getTime() - newDate.getTimezoneOffset() * 60 * 1000).toString();
	}
}
