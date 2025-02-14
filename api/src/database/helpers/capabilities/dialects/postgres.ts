import { CapabilitiesHelper } from '../types.js';

export class CapabilitiesHelperPostgres extends CapabilitiesHelper {
	override supportsAliasInGroupBy(): boolean {
		// Supported in Postgres (https://www.postgresql.org/message-id/7608.1259177709%40sss.pgh.pa.us)
		// Supported in CockroachDB since 20.1 (https://github.com/cockroachdb/cockroach/issues/28059
		return true;
	}
}
