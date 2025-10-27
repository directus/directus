import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	const policies = await knex('directus_permissions')
		.select('directus_permissions.id', 'directus_permissions.fields')
		.join('directus_policies', 'directus_policies.id', 'directus_permissions.policy')
		.where('directus_policies.app_access', '=', 1)
		.andWhere('directus_permissions.collection', '=', 'directus_users')
		.andWhere('directus_permissions.action', '=', 'read')
		.andWhere('directus_permissions.fields', '!=', '*');
	
	// there are definitely better ways of doing this
	for (const policy of policies) {
		if (typeof policy.fields === 'string' && policy.fields.length > 0 && !policy.fields.includes('provider')) {
			await knex('directus_permissions').update({
				fields: policy.fields + ',provider'
			}).where('id', '=', policy.id);
		}
	}

}

export async function down(_knex: Knex): Promise<void> {
	// do not try to remove anything from permissions
}
