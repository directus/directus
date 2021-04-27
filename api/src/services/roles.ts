import { ItemsService } from './items';
import { AbstractServiceOptions, PrimaryKey } from '../types';
import { PermissionsService } from './permissions';
import { UsersService } from './users';
import { PresetsService } from './presets';
import { UnprocessableEntityException } from '../exceptions';
import { toArray } from '../utils/to-array';

export class RolesService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_roles', options);
	}

	async deleteOne(key: PrimaryKey): Promise<PrimaryKey> {
		await this.deleteMany([key]);
		return key;
	}

	async deleteMany(keys: PrimaryKey[]): Promise<PrimaryKey[]> {
		// Make sure there's at least one admin role left after this deletion is done
		const otherAdminRoles = await this.knex
			.count('*', { as: 'count' })
			.from('directus_roles')
			.whereNotIn('id', keys)
			.andWhere({ admin_access: true })
			.first();
		const otherAdminRolesCount = +(otherAdminRoles?.count || 0);
		if (otherAdminRolesCount === 0) throw new UnprocessableEntityException(`You can't delete the last admin role.`);

		await this.knex.transaction(async (trx) => {
			const itemsService = new ItemsService('directus_roles', {
				knex: trx,
				accountability: this.accountability,
				schema: this.schema,
			});

			const permissionsService = new PermissionsService({
				knex: trx,
				accountability: this.accountability,
				schema: this.schema,
			});

			const presetsService = new PresetsService({
				knex: trx,
				accountability: this.accountability,
				schema: this.schema,
			});

			const usersService = new UsersService({
				knex: trx,
				accountability: this.accountability,
				schema: this.schema,
			});

			// Delete permissions/presets for this role, suspend all remaining users in role

			await permissionsService.deleteByQuery({
				filter: { role: { _in: keys } },
			});

			await presetsService.deleteByQuery({
				filter: { role: { _in: keys } },
			});

			await usersService.updateByQuery(
				{
					filter: { role: { _in: keys } },
				},
				{
					status: 'suspended',
					role: null,
				}
			);

			await itemsService.deleteMany(keys);
		});

		return keys;
	}

	/**
	 * @deprecated Use `deleteOne` or `deleteMany` instead
	 */
	delete(key: PrimaryKey): Promise<PrimaryKey>;
	delete(keys: PrimaryKey[]): Promise<PrimaryKey[]>;
	async delete(key: PrimaryKey | PrimaryKey[]): Promise<PrimaryKey | PrimaryKey[]> {
		if (Array.isArray(key)) return await this.deleteMany(key);
		return await this.deleteOne(key);
	}
}
