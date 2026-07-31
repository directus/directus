import type { Knex } from 'knex';
// @ts-expect-error -- knex doesn't ship types for its dialect internals
import BaseClientBetterSQLite3 from 'knex/lib/dialects/better-sqlite3/index.js';

/**
 * better-sqlite3 binds every JS number through `sqlite3_bind_double`, since only BigInt maps to
 * `sqlite3_bind_int64`. In a column with TEXT affinity, SQLite then stringifies the double, so an
 * integer primary key written into a varchar column lands as `"41.0"` instead of `"41"`.
 *
 * That silently breaks everything that stores an id as a string: the a2o junction `item` column
 * (`item = CAST(??.?? AS CHAR(255))` no longer matches), and the `item` columns on activity,
 * revisions, comments, notifications, shares and versions.
 *
 * node-sqlite3 bound integral numbers as integers, so restore that behavior by handing
 * better-sqlite3 a BigInt whenever the value is a safe integer. Anything outside that range keeps
 * the double path, which is what node-sqlite3 did as well, and reads are unaffected because safe
 * integers stay off.
 */
class DirectusBetterSQLite3 extends BaseClientBetterSQLite3 {
	_formatBindings(bindings: readonly unknown[] | undefined): unknown[] {
		const formatted: unknown[] = super._formatBindings(bindings);

		return formatted.map((binding) =>
			typeof binding === 'number' && Number.isSafeInteger(binding) ? BigInt(binding) : binding,
		);
	}
}

/**
 * `getDatabaseClient()` and `createInspector()` both dispatch on `knex.client.constructor.name`, so
 * the subclass has to report the same name as the dialect it extends. Set it explicitly rather than
 * relying on the class identifier, which bundlers are free to rename.
 */
Object.defineProperty(DirectusBetterSQLite3, 'name', { value: 'Client_BetterSQLite3' });

export const Client_BetterSQLite3 = DirectusBetterSQLite3 as unknown as typeof Knex.Client;
