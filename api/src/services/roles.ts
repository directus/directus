import { clearSystemCache } from '../cache.js';
import { AccessService } from './access.js';
import { ItemsService } from './items.js';
import { PresetsService } from './presets.js';
import { UsersService } from './users.js';
import { fetchRolesTree } from '../permissions/lib/fetch-roles-tree.js';
import { transaction } from '../utils/transaction.js';
import { InvalidPayloadError } from '@directus/errors';
import type { AbstractServiceOptions, Item, MutationOptions, PrimaryKey } from '@directus/types';
import { UserIntegrityCheckFlag } from '@directus/types';

export class RolesService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_roles', options);
	}

	// No need to check user integrity in createOne, as the creation of a role itself does not influence the number of
	// users, as the role of a user is actually updated in the UsersService on the user, which will make sure to
	// initiate a user integrity check if necessary. Same goes for role nesting check as well as cache clearing.

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

			await this.validateRoleNesting(keys as string[], data['parent']);
		}

		const result = await super.updateMany(keys, data, opts);

		// Only clear the permissions cache if the parent role has changed
		// If anything policies related has changed, the cache will be cleared in the AccessService as well
		if ('parent' in data) {
			await this.clearCaches();
		}

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

			const rolesItemsService = new ItemsService('directus_roles', options);
			const rolesService = new RolesService(options);
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

			// If the about to be deleted roles are the parent of other roles set those parents to null
			// Use a newly created RolesService here that works within the current transaction
			await rolesService.updateByQuery(
				{
					filter: { parent: { _in: keys } },
				},
				{ parent: null },
			);

			await rolesItemsService.deleteMany(keys, opts);
		});

		// Since nested roles could be updated, clear caches
		await this.clearCaches();

		return keys;
	}

	private async validateRoleNesting(ids: string[], parent: string) {
		if (ids.includes(parent)) {
			throw new InvalidPayloadError({ reason: 'A role cannot be a parent of itself' });
		}

		const roles = await fetchRolesTree(parent, { knex: this.knex });

		if (ids.some((id) => roles.includes(id))) {
			// The role tree up from the parent already includes this role, so it would create a circular reference
			throw new InvalidPayloadError({ reason: 'A role cannot have a parent that is already a descendant of itself' });
		}
	}

	private async clearCaches(opts?: MutationOptions) {
		await clearSystemCache({ autoPurgeCache: opts?.autoPurgeCache });

		if (this.cache && opts?.autoPurgeCache !== false) {
			await this.cache.clear();
		}
	}
}
