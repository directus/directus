import type { AbstractServiceOptions, Item, MutationOptions, PrimaryKey } from '@directus/types';
import { UserIntegrityCheckFlag } from '@directus/types';
import { clearSystemCache } from '../cache.js';
import { ItemsService } from './items.js';

export class AccessService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_access', options);
	}

	private async clearCaches(opts?: MutationOptions) {
		await clearSystemCache({ autoPurgeCache: opts?.autoPurgeCache });

		if (this.cache && opts?.autoPurgeCache !== false) {
			await this.cache.clear();
		}
	}

	override async createOne(data: Partial<Item>, opts: MutationOptions = {}): Promise<PrimaryKey> {
		// Creating a new policy attachments affects the number of admin/app/api users.
		// But it can only add app or admin users, so no need to check the remaining admin users.
		opts.userIntegrityCheckFlags =
			(opts.userIntegrityCheckFlags ?? UserIntegrityCheckFlag.None) | UserIntegrityCheckFlag.UserLimits;

		opts.onRequireUserIntegrityCheck?.(opts.userIntegrityCheckFlags);

		const result = await super.createOne(data, opts);

		// A new policy has been attached to a user or a role, clear the caches
		await this.clearCaches();

		return result;
	}

	override async updateMany(
		keys: PrimaryKey[],
		data: Partial<Item>,
		opts: MutationOptions = {},
	): Promise<PrimaryKey[]> {
		// Updating policy attachments might affect the number of admin/app/api users
		opts.userIntegrityCheckFlags = UserIntegrityCheckFlag.All;
		opts.onRequireUserIntegrityCheck?.(opts.userIntegrityCheckFlags);

		const result = await super.updateMany(keys, data, { ...opts, userIntegrityCheckFlags: UserIntegrityCheckFlag.All });

		// Some policy attachments have been updated, clear the caches
		await this.clearCaches();

		return result;
	}

	override async deleteMany(keys: PrimaryKey[], opts: MutationOptions = {}): Promise<PrimaryKey[]> {
		// Changes here can affect the number of admin/app/api users
		opts.userIntegrityCheckFlags = UserIntegrityCheckFlag.All;
		opts.onRequireUserIntegrityCheck?.(opts.userIntegrityCheckFlags);

		const result = await super.deleteMany(keys, opts);

		// Some policy attachments have been deleted, clear the caches
		await this.clearCaches();

		return result;
	}
}
