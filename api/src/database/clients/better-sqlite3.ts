import { MAX_SAFE_INT64, MIN_SAFE_INT64 } from '@directus/constants';
import knex, { type Knex } from 'knex';

/**
 * The better-sqlite3 dialect, with integer bindings kept off the driver's double path.
 *
 * better-sqlite3 binds every JS number through `sqlite3_bind_double`, since only BigInt maps to
 * `sqlite3_bind_int64`, so an integer id written into a TEXT-affinity column lands as `"41.0"`. That
 * breaks the a2o junction `item` column (`item = CAST(??.?? AS CHAR(255))` stops matching) and the
 * `item` columns on activity, revisions, comments, notifications, shares and versions.
 */
export function getClientBetterSQLite3(): typeof Knex.Client {
	// knex only exports the base `Client`, so we read the dialect class off a connectionless knex instance
	const createKnex: typeof knex.default = (knex as any).default ?? knex;

	const BaseBetterSQLite3 = createKnex({
		client: 'better-sqlite3',
		useNullAsDefault: true,
		compileSqlOnError: false,
	}).client.constructor as typeof Knex.Client;

	/**
	 * `getDatabaseClient()` and `createInspector()` both dispatch on `knex.client.constructor.name`, so
	 * renaming the class means updating them too.
	 */
	class DirectusBetterSQLite3 extends BaseBetterSQLite3 {
		/**
		 * Only integral bindings need this: SQLite renders a REAL as the shortest decimal that round-trips,
		 * so `91.97` already stringifies to `"91.97"`. Past int64 the driver rejects the BigInt outright,
		 * so those keep the double path, as do `Infinity` and `NaN` via `Number.isInteger`.
		 *
		 * An id beyond 2^53 is past rescuing here: `safeIntegers` stays off, so SQLite hands it back
		 * imprecise before it is ever rebound.
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
