import { isIP } from 'node:net';
import { InvalidPayloadError } from '@directus/errors';
import type { AbstractServiceOptions, MutationOptions, Policy, PrimaryKey } from '@directus/types';
import { UserIntegrityCheckFlag } from '@directus/types';
import { type IPv4, type IPv6, isValidCIDR, parse as parseIp } from 'ipaddr.js';
import { clearSystemCache } from '../cache.js';
import { clearCache as clearPermissionsCache } from '../permissions/cache.js';
import { ItemsService } from './items.js';

function isIpLessOrEqual(ipA: IPv4 | IPv6, ipB: IPv4 | IPv6) {
	const bytesA = ipA.toByteArray();
	const bytesB = ipB.toByteArray();

	for (let i = 0; i < bytesA.length; i++) {
		if (bytesA[i]! < bytesB[i]!) return true;
		if (bytesA[i]! > bytesB[i]!) return false;
	}

	return true;
}

export function isIpAccessValid(value?: any[] | null): boolean {
	if (value === undefined) return false;
	if (value === null) return true;
	if (Array.isArray(value) && value.length === 0) return true;

	for (let ip of value) {
		if (typeof ip !== 'string' || ip.includes('*')) return false;
		ip = ip.trim();

		// Validate IP Range
		if (ip.includes('-')) {
			const parts = ip.split('-');

			if (parts.length !== 2) return false;
			const ipMin = isIP(parts[0]!);
			const ipMax = isIP(parts[1]!);
			if (ipMin === 0 || ipMax === 0) return false;
			if (ipMin !== ipMax) return false;
			if (!isIpLessOrEqual(parseIp(parts[0]), parseIp(parts[1]))) return false;
			continue;
		}

		const parts = ip.split('/');

		// Validate singular IPs
		if (isIP(parts[0]!) === 0) return false;

		// Validate IP Subnetwork, but reject IP Masks
		if (parts.length == 2 && !isValidCIDR(ip)) return false;

		// Reject invalid IPs
		if (parts.length > 2) return false;
	}

	return true;
}

export class PoliciesService extends ItemsService<Policy> {
	constructor(options: AbstractServiceOptions) {
		super('directus_policies', options);
	}

	private async clearCaches(opts?: MutationOptions) {
		await clearSystemCache({ autoPurgeCache: opts?.autoPurgeCache, autoPurgeSchema: false });

		if (this.cache && opts?.autoPurgeCache !== false) {
			await this.cache.clear();
		}
	}

	private assertValidIpAccess(partialItem: Partial<Policy>): void {
		if ('ip_access' in partialItem && !isIpAccessValid(partialItem['ip_access'])) {
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

		// TODO is this necessary? Since the attachment should be handled in the AccessService
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
			opts.userIntegrityCheckFlags =
				(opts.userIntegrityCheckFlags ?? UserIntegrityCheckFlag.None) | UserIntegrityCheckFlag.UserLimits;
		}

		if (opts.userIntegrityCheckFlags) opts.onRequireUserIntegrityCheck?.(opts.userIntegrityCheckFlags);

		const result = await super.updateMany(keys, data, opts);

		if ('admin_access' in data || 'app_access' in data || 'ip_access' in data || 'enforce_tfa' in data) {
			// Some relevant properties on policies have been updated, clear the caches
			await this.clearCaches(opts);
		}

		return result;
	}

	override async deleteMany(keys: PrimaryKey[], opts: MutationOptions = {}): Promise<PrimaryKey[]> {
		opts.userIntegrityCheckFlags = UserIntegrityCheckFlag.All;
		opts.onRequireUserIntegrityCheck?.(opts.userIntegrityCheckFlags);

		const result = await super.deleteMany(keys, opts);

		// TODO is this necessary? Since the detachment should be handled in the AccessService
		// Some policies have been deleted, clear the permissions cache
		await this.clearCaches(opts);

		return result;
	}
}
