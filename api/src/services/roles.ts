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

	delete(key: PrimaryKey): Promise<PrimaryKey>;
	delete(keys: PrimaryKey[]): Promise<PrimaryKey[]>;
	async delete(key: PrimaryKey | PrimaryKey[]): Promise<PrimaryKey | PrimaryKey[]> {
		const keys = toArray(key);

		// Make sure there's at least one admin role left after this deletion is done
		const otherAdminRoles = await this.knex
			.count('*', { as: 'count' })
			.from('directus_roles')
			.whereNotIn('id', keys)
			.andWhere({ admin_access: true })
			.first();
		const otherAdminRolesCount = +(otherAdminRoles?.count || 0);
		if (otherAdminRolesCount === 0) throw new UnprocessableEntityException(`You can't delete the last admin role.`);

		// Remove all permissions associated with this role
		const permissionsService = new PermissionsService({
			knex: this.knex,
			accountability: this.accountability,
			schema: this.schema,
		});

		const permissionsForRole = (await permissionsService.readByQuery({
			fields: ['id'],
			filter: { role: { _in: keys } },
		})) as { id: number }[];

		const permissionIDs = permissionsForRole.map((permission) => permission.id);
		await permissionsService.delete(permissionIDs);

		// Remove all presets that are attached to this role
		const presetsService = new PresetsService({
			knex: this.knex,
			accountability: this.accountability,
			schema: this.schema,
		});

		const presetsForRole = (await presetsService.readByQuery({
			fields: ['id'],
			filter: { role: { _in: keys } },
		})) as { id: string }[];

		const presetIDs = presetsForRole.map((preset) => preset.id);
		await presetsService.delete(presetIDs);

		// Nullify role for users in this role
		const usersService = new UsersService({
			knex: this.knex,
			accountability: this.accountability,
			schema: this.schema,
		});

		const usersInRole = (await usersService.readByQuery({
			fields: ['id'],
			filter: { role: { _in: keys } },
		})) as { id: string }[];

		const userIDs = usersInRole.map((user) => user.id);
		await usersService.update({ status: 'suspended', role: null }, userIDs);

		await super.delete(key as any);
		return key;
	}
}
