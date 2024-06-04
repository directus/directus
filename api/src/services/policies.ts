import { ForbiddenError } from '@directus/errors';
import type { Policy } from '@directus/types';
import { fetchPolicies } from '../permissions/lib/fetch-policies.js';
import type { AbstractServiceOptions } from '../types/index.js';
import { ItemsService } from './items.js';

export class PoliciesService extends ItemsService<Policy> {
	constructor(options: AbstractServiceOptions) {
		super('directus_policies', options);
	}

	async fetchPolicyFlagsForAccountability(): Promise<Pick<Policy, 'app_access' | 'admin_access' | 'enforce_tfa'>> {
		if (!this.accountability?.user || !this.accountability?.role) throw new ForbiddenError();

		const ids = await fetchPolicies(this.accountability, { schema: this.schema, knex: this.knex });
		const policies = await this.readMany(ids, { fields: ['enforce_tfa'] });
		const enforce_tfa = policies.some((policy) => policy.enforce_tfa);
		return {
			app_access: this.accountability.app,
			admin_access: this.accountability.admin,
			enforce_tfa,
		};
	}
}
