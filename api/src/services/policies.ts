import { ForbiddenError } from '@directus/errors';
import type { Policy, PrimaryKey } from '@directus/types';
import { clearCache as clearPermissionsCache } from '../permissions/cache.js';
import { fetchPolicies } from '../permissions/lib/fetch-policies.js';
import type { AbstractServiceOptions, MutationOptions } from '../types/index.js';
import { ItemsService } from './items.js';

export class PoliciesService extends ItemsService<Policy> {
	constructor(options: AbstractServiceOptions) {
		super('directus_policies', options);
	}

	override async createOne(data: Partial<Policy>, opts: MutationOptions = {}): Promise<PrimaryKey> {
		const result = await super.createOne(data, opts);

		// A new policy has created, clear the permissions cache
		await clearPermissionsCache();

		return result;
	}

	override async updateMany(
		keys: PrimaryKey[],
		data: Partial<Policy>,
		opts: MutationOptions = {},
	): Promise<PrimaryKey[]> {
		const result = await super.updateMany(keys, data, opts);

		// Some policies have been updated, clear the permissions cache
		await clearPermissionsCache();

		return result;
	}

	override async deleteMany(keys: PrimaryKey[], opts: MutationOptions = {}): Promise<PrimaryKey[]> {
		const result = await super.deleteMany(keys, opts);

		// Some policies have been deleted, clear the permissions cache
		await clearPermissionsCache();

		return result;
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
