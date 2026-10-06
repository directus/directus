import { CapabilitiesHelper } from '../types.js';

export class CapabilitiesHelperPostgres extends CapabilitiesHelper {
	override supportsColumnPositionInGroupBy(): boolean {
		// Supported in Postgres https://www.postgresql.org/docs/8.3/sql-select.html#SQL-GROUPBY
		// Supported in CockroachDB (tested manually)
		return true;
	}

	override supportsDeduplicationOfParameters(): boolean {
		// Postgres infers the type from the context in which the parameter is first referenced.
		// This causes issues when the same parameter is used in different contexts with different types.
		// See https://www.postgresql.org/docs/current/sql-prepare.html
		return false;
	}

	override maxInListSize(): number {
		// The wire protocol stores the parameter count as a 16-bit integer
		// https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-BIND
		return 65535;
	}
}
