import knex, { type Knex } from 'knex';

let client: typeof Knex.Client | undefined;

/**
 * The knex client Directus uses for SQLite: the better-sqlite3 dialect, with integer bindings kept
 * off the driver's double path.
 *
 * better-sqlite3 binds every JS number through `sqlite3_bind_double`, since only BigInt maps to
 * `sqlite3_bind_int64`. In a column with TEXT affinity, SQLite then stringifies the double, so an
 * integer primary key written into a varchar column lands as `"41.0"` instead of `"41"`.
 *
 * That silently breaks everything that stores an id as a string: the a2o junction `item` column
 * (`item = CAST(??.?? AS CHAR(255))` no longer matches), and the `item` columns on activity,
 * revisions, comments, notifications, shares and versions.
 *
 * `Client.prepBindings` is the seam for the correction rather than the dialect's own
 * `_formatBindings`: it's part of knex's published `Knex.Client` surface, knex's own oracledb dialect
 * overrides it for the same kind of driver quirk, and every query passes through it via
 * `enrichQueryObject`, whether it came from the query builder, from `knex.raw`, or from the schema
 * builder.
 *
 * Handing knex a subclass as `config.client` is the only install site that covers writes as well as
 * reads, and it's knex's documented extension point for customising a dialect. The alternatives
 * don't reach far enough:
 *
 * - Assigning to `database.client.prepBindings` after `knex()` returns misses every transaction.
 *   `makeTxClient` builds a transaction's client with `Object.create(client.constructor.prototype)`
 *   and copies over only `version`, `config`, `driver`, `connectionSettings`, `transacting`,
 *   `valueForUndefined` and `logger`, so own properties on the outer client are invisible inside it —
 *   and every mutation runs in a transaction.
 * - A per-query `client` proxy, the way `withPreprocessBindings` does it, needs a query builder to
 *   swap the client on. Reads have one; writes and DDL don't.
 * - The `query` event can't be used to fix bindings. `enrichQueryObject` calls `prepBindings` first
 *   and only then emits a shallow copy of the query object, so a listener is both too late and
 *   working on a copy.
 */
export function getClientBetterSQLite3(): typeof Knex.Client {
	if (client) return client;

	/**
	 * knex resolves dialect classes internally and exports only the base `Client`, so the way to get
	 * hold of one without reaching into `knex/lib` is to let knex resolve it and read it back off the
	 * client it built. A config without `connection` initialises neither a driver nor a pool, so this
	 * knex holds no resources and needs no teardown.
	 */
	const createKnex: typeof knex.default = (knex as any).default ?? knex;

	const BaseBetterSQLite3 = createKnex({ client: 'better-sqlite3', useNullAsDefault: true }).client
		.constructor as typeof Knex.Client;

	/**
	 * `getDatabaseClient()` and `createInspector()` both dispatch on `knex.client.constructor.name`, so
	 * both carry a case for this name alongside the knex dialects they recognise. Renaming the class
	 * means updating them too.
	 */
	class DirectusBetterSQLite3 extends BaseBetterSQLite3 {
		/**
		 * Hand better-sqlite3 a BigInt whenever a binding is an integer, so ids keep their exact form.
		 * Anything outside the safe integer range stays on the double path, since it can't round-trip
		 * through a JS number anyway. Reads are unaffected: `safeIntegers` governs how values come out
		 * of SQLite and stays off, so integers still read back as numbers.
		 */
		override prepBindings(bindings: Knex.Value[]): any {
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

	client = DirectusBetterSQLite3;

	return client;
}
