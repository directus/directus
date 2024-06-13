import type { Item, PrimaryKey } from '@directus/types';
import { clearCache as clearPermissionsCache } from '../permissions/cache.js';
import type { AbstractServiceOptions, MutationOptions } from '../types/index.js';
import { UserIntegrityCheckFlag } from '../utils/validate-user-count-integrity.js';
import { ItemsService } from './items.js';

export class AccessService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_access', options);
	}

	override async createOne(data: Partial<Item>, opts: MutationOptions = {}): Promise<PrimaryKey> {
		if (opts.onRequireUserIntegrityCheck) {
			// Creating a new policy attachments affects the number of admin/app/api users
			opts.onRequireUserIntegrityCheck(UserIntegrityCheckFlag.All);
		}

		const result = await super.createOne(data, { ...opts, userIntegrityCheckFlags: UserIntegrityCheckFlag.All });

		// A new policy has been attached to a user or a role, clear the permissions cache
		await clearPermissionsCache();

		return result;
	}

	override async updateMany(
		keys: PrimaryKey[],
		data: Partial<Item>,
		opts: MutationOptions = {},
	): Promise<PrimaryKey[]> {
		if (opts.onRequireUserIntegrityCheck) {
			// Updating policy attachments might affect the number of admin/app/api users
			opts.onRequireUserIntegrityCheck(UserIntegrityCheckFlag.All);
		}

		const result = await super.updateMany(keys, data, { ...opts, userIntegrityCheckFlags: UserIntegrityCheckFlag.All });

		// Some policy attachments have been updated, clear the permissions cache
		await clearPermissionsCache();

		return result;
	}

	override async deleteMany(keys: PrimaryKey[], opts: MutationOptions = {}): Promise<PrimaryKey[]> {
		// Changes here can affect the number of admin/app/api users
		if (opts.onRequireUserIntegrityCheck) {
			opts.onRequireUserIntegrityCheck(UserIntegrityCheckFlag.All);
		} else {
			opts.userIntegrityCheckFlags = UserIntegrityCheckFlag.All;
		}

		const result = await super.deleteMany(keys, opts);

		// Some policy attachments have been deleted, clear the permissions cache
		await clearPermissionsCache();

		return result;
	}
}
