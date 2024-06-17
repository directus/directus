import type { Item, PrimaryKey } from '@directus/types';
import { clearCache as clearPermissionsCache } from '../permissions/cache.js';
import type { AbstractServiceOptions, MutationOptions } from '../types/index.js';
import { transaction } from '../utils/transaction.js';
import { UserIntegrityCheckFlag } from '../utils/validate-user-count-integrity.js';
import { ItemsService } from './items.js';
import { AccessService } from './access.js';
import { PresetsService } from './presets.js';
import { UsersService } from './users.js';

export class RolesService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_roles', options);
	}

	// No need to check user integrity in createOne, as the creation of a role itself does not influence the number of
	// users, as the role of a user is actually updated in the UsersService on the user, which will make sure to
	// initiate a user integrity check if necessary

	override async updateMany(
		keys: PrimaryKey[],
		data: Partial<Item>,
		opts: MutationOptions = {},
	): Promise<PrimaryKey[]> {
		if ('parent' in data) {
			// If the parent of a role changed we need to make a full integrity check.
			// Anything related to policies will be checked in the AccessService, where the policies are attached to roles
			opts.userIntegrityCheckFlags = UserIntegrityCheckFlag.All;
			opts.onRequireUserIntegrityCheck?.(opts.userIntegrityCheckFlags);
		}

		const result = await super.updateMany(keys, data, opts);

		// Only clear the permissions cache if the parent role has changed
		// If anything policies related has changed, the cache will be cleared in the AccessService as well
		if (opts.userIntegrityCheckFlags) await clearPermissionsCache();

		return result;
	}

	override async deleteMany(keys: PrimaryKey[], opts: MutationOptions = {}): Promise<PrimaryKey[]> {
		opts.userIntegrityCheckFlags = UserIntegrityCheckFlag.All;
		opts.onRequireUserIntegrityCheck?.(opts.userIntegrityCheckFlags);

		await transaction(this.knex, async (trx) => {
			const options: AbstractServiceOptions = {
				knex: trx,
				accountability: this.accountability,
				schema: this.schema,
			};

			const itemsService = new ItemsService('directus_roles', options);
			const accessService = new AccessService(options);
			const presetsService = new PresetsService(options);
			const usersService = new UsersService(options);

			// Delete permissions/presets for this role, suspend all remaining users in role

			await accessService.deleteByQuery(
				{
					filter: { role: { _in: keys } },
				},
				{ ...opts, bypassLimits: true },
			);

			await presetsService.deleteByQuery(
				{
					filter: { role: { _in: keys } },
				},
				{ ...opts, bypassLimits: true },
			);

			await usersService.updateByQuery(
				{
					filter: { role: { _in: keys } },
				},
				{
					status: 'suspended',
					role: null,
				},
				{ ...opts, bypassLimits: true },
			);

			await itemsService.deleteMany(keys, opts);
		});

		// Since nested roles could be updated, clear permissions cache
		await clearPermissionsCache();

		return keys;
	}
}
