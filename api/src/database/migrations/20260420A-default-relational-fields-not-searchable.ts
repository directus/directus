import { RELATIONAL_TYPES } from '@directus/constants';
import type { Knex } from 'knex';

/**
 * Flip existing relational fields to `searchable = false`.
 *
 * The `searchable` column on `directus_fields` was introduced by migration
 * `20251012A-add-field-searchable.ts` with a column-level default of `true`. The Studio
 * UI has historically hidden the Searchable toggle for relational localTypes, so every
 * relational field in existing projects currently has `searchable = true` in the DB
 * despite never being exposed as searchable in the UI.
 *
 * This migration pairs with two changes shipped in the same release:
 *   1. The Studio UI now surfaces the toggle for `translations` and `o2m` relational fields.
 *   2. The API now emits EXISTS subqueries against o2m-related collections when the alias
 *      field's `searchable` flag is true — which makes the DB value suddenly meaningful.
 *
 * Leaving existing rows at `true` would opt every project in to potentially-heavy
 * relational search subqueries without the admin asking. Flip them all to `false` so
 * admins must explicitly opt in per-relation going forward.
 *
 * Notes:
 * - `directus_fields.special` is stored as a comma-joined string. We LIKE-prefilter on
 *   the server and then exact-match after splitting, so `foom2o` does not match `m2o`.
 * - The `UPDATE` is idempotent: re-running against already-`false` rows is a no-op, so
 *   if this migration aborts mid-execution the next boot simply finishes the work.
 * - Standard fields (no relational special) are left alone — their column-level default
 *   of `true` remains correct.
 * - `down` is intentionally a no-op: the prior per-row values cannot be reconstructed
 *   from the post-update state.
 */
export async function up(knex: Knex): Promise<void> {
	// DB-side prefilter — avoids pulling every `directus_fields` row into Node.
	const candidates = await knex
		.select('id', 'special')
		.from('directus_fields')
		.where((builder) => {
			for (const special of RELATIONAL_TYPES) {
				builder.orWhere('special', 'like', `%${special}%`);
			}
		});

	// In-memory exact-match verification (split comma-joined `special`, trim, exact compare).
	const ids = candidates
		.filter((row: { id: number; special: string | null }) => {
			if (!row.special) return false;

			const specials = String(row.special)
				.split(',')
				.map((s) => s.trim());

			return specials.some((s) => (RELATIONAL_TYPES as readonly string[]).includes(s));
		})
		.map((row) => row.id);

	if (ids.length > 0) {
		await knex('directus_fields').update({ searchable: false }).whereIn('id', ids);
	}
}

export async function down(_knex: Knex): Promise<void> {
	// Intentional no-op: prior per-row values cannot be reliably restored once overwritten.
}
