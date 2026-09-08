import { HARDCODED_AUTH_REQUIREMENTS } from '@directus/constants';
import type { Knex } from 'knex';

/**
 * `directus_permissions` rows for actions the API restricts to admins regardless of RBAC
 * (`HARDCODED_AUTH_REQUIREMENTS` with `requiredAuth: 'admin'`) never take effect: the service layer
 * throws before the permission rule is consulted. Remove the dead rows so the Data Studio permission
 * grid reflects what is actually enforceable.
 *
 * Only the `admin` subset is purged. `user`-gated rows (`directus_comments`) are honored for any
 * authenticated request, so they are left untouched.
 */

const adminOnlyPairs = HARDCODED_AUTH_REQUIREMENTS.filter(({ requiredAuth }) => requiredAuth === 'admin');

export async function up(knex: Knex): Promise<void> {
	if (adminOnlyPairs.length === 0) return;

	await knex('directus_permissions')
		.where((builder) => {
			for (const { collection, action } of adminOnlyPairs) {
				builder.orWhere({ collection, action });
			}
		})
		.delete();
}

export async function down(): Promise<void> {
	// Irreversible: the removed rows had no effect, so there is nothing meaningful to restore.
}
