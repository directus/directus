import type { Item, PrimaryKey } from '@directus/types';
import { clearCache as clearPermissionsCache } from '../permissions/cache.js';
import { validateRemainingAdminUsers } from '../permissions/modules/validate-remaining-admin/validate-remaining-admin-users.js';
import type { AbstractServiceOptions, MutationOptions } from '../types/index.js';
import { USER_INTEGRITY_CHECK_ALL } from '../utils/validate-user-count-integrity.js';
import { ItemsService } from './items.js';

export class AccessService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_access', options);
	}

	override async createOne(data: Partial<Item>, opts: MutationOptions = {}): Promise<PrimaryKey> {
		if (opts.onRequireUserIntegrityCheck) {
			// Creating a new policy attachments affects the number of admin/app/api users
			opts.onRequireUserIntegrityCheck(USER_INTEGRITY_CHECK_ALL);
		}

		const result = await super.createOne(data, { ...opts, userIntegrityCheckFlags: USER_INTEGRITY_CHECK_ALL });

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
			opts.onRequireUserIntegrityCheck(USER_INTEGRITY_CHECK_ALL);
		}

		const result = await super.updateMany(keys, data, { ...opts, userIntegrityCheckFlags: USER_INTEGRITY_CHECK_ALL });

		// Some policy attachments have been updated, clear the permissions cache
		await clearPermissionsCache();

		return result;
	}

	override async deleteMany(keys: PrimaryKey[], opts: MutationOptions = {}): Promise<PrimaryKey[]> {
		if (opts.onRequireUserIntegrityCheck) {
			opts.onRequireUserIntegrityCheck(USER_INTEGRITY_CHECK_ALL);
		} else {
			// This is the top level mutation, validate remaining admin users, excluding the about to be removed policy attachments
			try {
				await validateRemainingAdminUsers({ excludeAccessRows: keys }, { schema: this.schema, knex: this.knex });
			} catch (err: any) {
				opts.preMutationError = err;
			}
		}

		const result = await super.deleteMany(keys, opts);

		// Some policy attachments have been deleted, clear the permissions cache
		await clearPermissionsCache();

		return result;
	}
}
