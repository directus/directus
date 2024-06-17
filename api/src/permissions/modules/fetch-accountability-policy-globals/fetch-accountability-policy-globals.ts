import type { Accountability } from '@directus/types';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import type { Context } from '../../types.js';

export async function fetchAccountabilityPolicyGlobals(
	accountability: Pick<Accountability, 'user' | 'roles' | 'ip' | 'admin' | 'app'>,
	context: Context,
) {
	const policies = await fetchPolicies(accountability, context);

	const result = await context.knex
		.select(1)
		.from('directus_policies')
		.whereIn('id', policies)
		.where('enforce_tfa', true)
		.first();

	return {
		app_access: accountability.app,
		admin_access: accountability.admin,
		enforce_tfa: !!result,
	};
}
