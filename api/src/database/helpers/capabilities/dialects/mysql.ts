import { CapabilitiesHelper } from '../types.js';

export class CapabilitiesHelperMySQL extends CapabilitiesHelper {
	override supportsColumnPositionInGroupBy(): boolean {
		// Supported in MySQL https://dev.mysql.com/doc/refman/8.4/en/select.html#id756773
		// > Columns selected for output can be referred to in ORDER BY and GROUP BY clauses using column names,
		//   column aliases, or column positions. Column positions are integers and begin with 1:
		return true;
	}

	/**
	 * MySQL: no native `INSERT … RETURNING`.
	 *
	 * MariaDB ≥ 10.5 (2020-06) does support it (https://mariadb.com/kb/en/insertreturning/),
	 * but knex treats `.returning()` as a no-op for the mysql dialect and logs
	 * `".returning() is not supported by mysql and will not have any effect."`
	 * Tracked upstream at https://github.com/knex/knex/issues/6254. Both MariaDB
	 * and MySQL route through `Client_MySQL2` and surface as `'mysql'` in
	 * `getDatabaseClient()`, so we can't dispatch them separately at this layer
	 * either.
	 *
	 * When knex grows MariaDB-aware RETURNING emission and Directus exposes MariaDB
	 * as its own `DatabaseClient` value, this method can probe `SELECT VERSION()`
	 * for the `-MariaDB` suffix and return `true` for ≥ 10.5.
	 */
	override async preservesInsertOrderInReturning(): Promise<boolean> {
		return false;
	}
}
