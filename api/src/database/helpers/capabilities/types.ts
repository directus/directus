import { DatabaseHelper } from '../types.js';

export class CapabilitiesHelper extends DatabaseHelper {
	supportsColumnPositionInGroupBy(): boolean {
		return false;
	}

	/**
	 * Indicates if the values within the list of parameters can be safely deduplicated.
	 * This is useful for databases that do not automatically cast the value for cases when a parameter is referenced multiple times in the query,
	 * but the targeting type is different. For example when referencing a parameter which a UUID, postgres cannot use the same parameter reference
	 * to compare it against column of type UUID and at the same time against a column of type a string.
	 */
	supportsDeduplicationOfParameters(): boolean {
		return true;
	}

	/**
	 * Whether `INSERT … RETURNING` (or the dialect equivalent) yields rows in
	 * insertion order with a contractual guarantee.
	 *
	 * - When `true`: `ItemsService.createMany` uses a single multi-row
	 *   `knex.batchInsert` and maps the returned PKs back positionally.
	 * - When `false`: it falls back to a per-row insert loop.
	 *
	 * Default: `false` — the conservative answer. Override only in dialects where
	 * both:
	 * - the underlying RETURNING semantics, AND
	 * - the knex driver path emitting them
	 * preserve order.
	 */
	async preservesInsertOrderInReturning(): Promise<boolean> {
		return false;
	}
}
