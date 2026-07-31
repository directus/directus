import type { Knex } from 'knex';
// @ts-expect-error -- knex doesn't ship types for its dialect internals
import BaseClientBetterSQLite3 from 'knex/lib/dialects/better-sqlite3/index.js';

/**
 * Mirrors `api/src/database/clients/better-sqlite3.ts`, kept in sync by hand because the sandbox
 * can't import from the api package.
 *
 * better-sqlite3 binds every JS number as a double, so an integer written into a column with TEXT
 * affinity lands as `"41.0"` instead of `"41"`. Bind safe integers as BigInt to get the
 * node-sqlite3 behavior back.
 */
class DirectusBetterSQLite3 extends BaseClientBetterSQLite3 {
	_formatBindings(bindings: readonly unknown[] | undefined): unknown[] {
		const formatted: unknown[] = super._formatBindings(bindings);

		return formatted.map((binding) =>
			typeof binding === 'number' && Number.isSafeInteger(binding) ? BigInt(binding) : binding,
		);
	}
}

// Consumers dispatch on `knex.client.constructor.name`, so keep reporting the dialect's own name
Object.defineProperty(DirectusBetterSQLite3, 'name', { value: 'Client_BetterSQLite3' });

export const Client_BetterSQLite3 = DirectusBetterSQLite3 as unknown as typeof Knex.Client;
