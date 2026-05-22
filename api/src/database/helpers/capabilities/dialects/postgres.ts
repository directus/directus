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

	override async preservesInsertOrderInReturning(): Promise<boolean> {
		// Postgres's INSERT … RETURNING returns one row per inserted row, in insertion order,
		// within a single statement. Same semantics inherited by CockroachDB and Redshift.
		// https://www.postgresql.org/docs/current/sql-insert.html
		return true;
	}
}
