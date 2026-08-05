import { MAX_SAFE_INT64, MIN_SAFE_INT64 } from '@directus/constants';
import knex, { type Knex } from 'knex';

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
 */
export function getClientBetterSQLite3(): typeof Knex.Client {
	// knex only exports the base `Client`, so we read the dialect class off a connectionless knex instance
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
		 * Integral doubles are the only bindings that need it: SQLite renders a REAL into a TEXT column
		 * as the shortest decimal that round-trips, which for `91.97` is already `"91.97"`, but for `41`
		 * has to keep a decimal point.
		 *
		 * Past int64 the driver rejects the BigInt outright (`RangeError: The bound string, buffer, or
		 * bigint is too big`), so those stay on the double path, along with `Infinity` and `NaN`, which
		 * `Number.isInteger` already excludes.
		 *
		 * This can't rescue an id beyond 2^53. `safeIntegers` governs how values come out of SQLite and
		 * stays off, so such an id is already an imprecise number by the time it is rebound, and its
		 * stored text still won't match `CAST(id AS CHAR(255))`. Fixing that means turning `safeIntegers`
		 * on and handling BigInt across every read path.
		 */
		override prepBindings(bindings: Knex.Value[]): any {
			const prepared = super.prepBindings(bindings);

			// A query without bindings hands us `undefined`, and named bindings arrive as an object
			if (!Array.isArray(prepared)) return prepared;

			return prepared.map((binding) => {
				if (typeof binding !== 'number' || !Number.isInteger(binding)) {
					return binding;
				}

				const asBigInt = BigInt(binding);

				if (asBigInt < MIN_SAFE_INT64 || asBigInt > MAX_SAFE_INT64) {
					return binding;
				}

				return asBigInt;
			});
		}
	}

	return DirectusBetterSQLite3;
}
