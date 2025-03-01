import { CapabilitiesHelper } from '../types.js';

export class CapabilitiesHelperPostgres extends CapabilitiesHelper {
	override supportsColumnPositionInGroupBy(): boolean {
		// Supported in Postgres https://www.postgresql.org/docs/8.3/sql-select.html#SQL-GROUPBY
		// Supported in CockroachDB (tested manually)
		return true;
	}
}
