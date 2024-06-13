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

	override async updateMany(
		keys: PrimaryKey[],
		data: Partial<Item>,
		opts: MutationOptions = {},
	): Promise<PrimaryKey[]> {
		if ('parent' in data) {
			opts.userIntegrityCheckFlags = UserIntegrityCheckFlag.All;
		}

		const result = await super.updateMany(keys, data, opts);

		if (opts.userIntegrityCheckFlags) await clearPermissionsCache();

		return result;
	}

	override async deleteMany(keys: PrimaryKey[], opts: MutationOptions = {}): Promise<PrimaryKey[]> {
		if (opts.onRequireUserIntegrityCheck) {
			opts.onRequireUserIntegrityCheck(UserIntegrityCheckFlag.All);
		} else {
			opts.userIntegrityCheckFlags = UserIntegrityCheckFlag.All;
		}

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
