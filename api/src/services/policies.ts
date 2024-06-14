import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import type { Policy, PrimaryKey } from '@directus/types';
import { getMatch } from 'ip-matching';
import { clearCache as clearPermissionsCache } from '../permissions/cache.js';
import { fetchPolicies } from '../permissions/lib/fetch-policies.js';
import type { AbstractServiceOptions, MutationOptions } from '../types/index.js';
import { UserIntegrityCheckFlag } from '../utils/validate-user-count-integrity.js';
import { ItemsService } from './items.js';

export class PoliciesService extends ItemsService<Policy> {
	constructor(options: AbstractServiceOptions) {
		super('directus_policies', options);
	}

	private isIpAccessValid(value?: any[] | null): boolean {
		if (value === undefined) return false;
		if (value === null) return true;
		if (Array.isArray(value) && value.length === 0) return true;

		for (const ip of value) {
			if (typeof ip !== 'string' || ip.includes('*')) return false;

			try {
				const match = getMatch(ip);
				if (match.type == 'IPMask') return false;
			} catch {
				return false;
			}
		}

		return true;
	}

	private assertValidIpAccess(partialItem: Partial<Policy>): void {
		if ('ip_access' in partialItem && !this.isIpAccessValid(partialItem['ip_access'])) {
			throw new InvalidPayloadError({
				reason: 'IP Access contains an incorrect value. Valid values are: IP addresses, IP ranges and CIDR blocks',
			});
		}
	}

	override async createOne(data: Partial<Policy>, opts: MutationOptions = {}): Promise<PrimaryKey> {
		this.assertValidIpAccess(data);

		// A policy has been created, but the attachment to a user/role happens in the AccessService,
		// so no need to check user integrity

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
		this.assertValidIpAccess(data);

		if ('admin_access' in data) {
			let flags = UserIntegrityCheckFlag.RemainingAdmins;

			if (data['admin_access'] === true) {
				// Only need to perform a full user count if the policy allows admin access
				flags |= UserIntegrityCheckFlag.All;
			}

			opts.userIntegrityCheckFlags = (opts.userIntegrityCheckFlags ?? UserIntegrityCheckFlag.None) | flags;
		}

		if ('app_access' in data) {
			opts.userIntegrityCheckFlags = UserIntegrityCheckFlag.All;
		}

		if (opts.userIntegrityCheckFlags) opts.onRequireUserIntegrityCheck?.(opts.userIntegrityCheckFlags);

		const result = await super.updateMany(keys, data, opts);

		// Some policies have been updated, clear the permissions cache
		await clearPermissionsCache();

		return result;
	}

	override async deleteMany(keys: PrimaryKey[], opts: MutationOptions = {}): Promise<PrimaryKey[]> {
		opts.userIntegrityCheckFlags = UserIntegrityCheckFlag.All;
		opts.onRequireUserIntegrityCheck?.(opts.userIntegrityCheckFlags);

		const result = await super.deleteMany(keys, opts);

		// Some policies have been deleted, clear the permissions cache
		await clearPermissionsCache();

		return result;
	}

	async fetchPolicyFlagsForAccountability(): Promise<Pick<Policy, 'app_access' | 'admin_access' | 'enforce_tfa'>> {
		if (!this.accountability?.user && !this.accountability?.role) throw new ForbiddenError();

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
