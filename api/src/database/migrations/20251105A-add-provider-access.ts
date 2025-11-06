import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	const rowsLimit = 100;
	let rowsOffset = 0;
	let hasMore = true;

	while (hasMore) {
		const policies = await knex('directus_permissions')
			.select('directus_permissions.id', 'directus_permissions.fields')
			.join('directus_policies', 'directus_policies.id', 'directus_permissions.policy')
			.where('directus_policies.app_access', '=', 1)
			.andWhere('directus_permissions.collection', '=', 'directus_users')
			.andWhere('directus_permissions.action', '=', 'read')
			.andWhereNot('directus_permissions.fields', 'LIKE', '*')
			.limit(rowsLimit)
			.offset(rowsOffset);

		if (policies.length === 0) {
			hasMore = false;
			break;
		}

		for (const policy of policies) {
			if (policy && 'id' in policy && typeof policy.fields === 'string') {
				const fields = policy.fields.split(',');

				if (!fields.includes('provider')) {
					fields.push('provider');

					await knex('directus_permissions')
						.update({
							fields: fields.join(','),
						})
						.where('id', '=', policy.id);
				}
			}
		}

		rowsOffset += rowsLimit;

		if (policies.length < rowsLimit) {
			hasMore = false;
			break;
		}
	}
}

export async function down(_knex: Knex): Promise<void> {
	// do not try to remove anything from permissions
}
