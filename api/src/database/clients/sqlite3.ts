import type { Knex } from 'knex';
// @ts-expect-error -- knex doesn't ship types for its dialect internals
import BaseClientBetterSQLite3 from 'knex/lib/dialects/better-sqlite3/index.js';

const ClientBetterSQLite3 = BaseClientBetterSQLite3 as typeof Knex.Client;

/**
 * better-sqlite3 binds every JS number through `sqlite3_bind_double`, since only BigInt maps to
 * `sqlite3_bind_int64`. In a column with TEXT affinity, SQLite then stringifies the double, so an
 * integer primary key written into a varchar column lands as `"41.0"` instead of `"41"`.
 *
 * That silently breaks everything that stores an id as a string: the a2o junction `item` column
 * (`item = CAST(??.?? AS CHAR(255))` no longer matches), and the `item` columns on activity,
 * revisions, comments, notifications, shares and versions.
 *
 * Hand better-sqlite3 a BigInt whenever a binding is an integer, so those ids keep their exact
 * form. Anything outside the safe integer range stays on the double path, since it can't round-trip
 * through a JS number anyway. Reads are unaffected: `safeIntegers` governs how values come out of
 * SQLite and stays off, so integers still read back as numbers.
 *
 * `prepBindings` is the seam for this rather than the dialect's own `_formatBindings`: it's part of
 * knex's published `Knex.Client` surface, knex's own oracledb dialect overrides it for the same kind
 * of driver quirk, and every query passes through it, whether it came from the query builder, from
 * `knex.raw`, or from the schema builder.
 */
export class DirectusBetterSQLite3 extends ClientBetterSQLite3 {
	override prepBindings(bindings: unknown): unknown {
		const prepared = super.prepBindings(bindings);

		// A query without bindings hands us `undefined`, and named bindings arrive as an object
		if (!Array.isArray(prepared)) return prepared;

		return prepared.map((binding) => {
			if (typeof binding === 'number' && Number.isSafeInteger(binding)) {
				return BigInt(binding);
			}

			return binding;
		});
	}
}

/**
 * `getDatabaseClient()` and `createInspector()` both dispatch on `knex.client.constructor.name`, so
 * the subclass has to report the same name as the dialect it extends. Set it explicitly rather than
 * relying on the class identifier, which bundlers are free to rename.
 */
Object.defineProperty(DirectusBetterSQLite3, 'name', { value: 'Client_BetterSQLite3' });
