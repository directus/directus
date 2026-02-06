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

	protected override async checkJsonSupport(): Promise<boolean> {
		// JSON functions were introduced in PostgreSQL 9.2, JSONB in 9.4
		// Check if -> and ->> operators are supported
		try {
			await this.knex.raw(`SELECT '{"name":"test"}'::jsonb ->> 'name' as result`);
			return true;
		} catch {
			return false;
		}
	}
}
