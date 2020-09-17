import ItemsService from './items';
import { AbstractServiceOptions, PrimaryKey } from '../types';
import PermissionsService from './permissions';
import UsersService from './users';
import PresetsService from './presets';

export default class RolesService extends ItemsService {
	constructor(options?: AbstractServiceOptions) {
		super('directus_roles', options);
	}

	delete(key: PrimaryKey): Promise<PrimaryKey>;
	delete(keys: PrimaryKey[]): Promise<PrimaryKey[]>;
	async delete(key: PrimaryKey | PrimaryKey[]): Promise<PrimaryKey | PrimaryKey[]> {
		const keys = Array.isArray(key) ? key : [key];

		// Remove all permissions associated with this role
		const permissionsService = new PermissionsService({
			knex: this.knex,
			accountability: this.accountability,
		});
		const permissionsForRole = await permissionsService.readByQuery({
			fields: ['id'],
			filter: { role: { _in: keys } },
		});
		const permissionIDs = permissionsForRole.map((permission) => permission.id);
		await permissionsService.delete(permissionIDs);

		// Remove all presets that are attached to this role
		const presetsService = new PresetsService({
			knex: this.knex,
			accountability: this.accountability,
		});
		const presetsForRole = await presetsService.readByQuery({
			fields: ['id'],
			filter: { role: { _in: keys } },
		});
		const presetIDs = presetsForRole.map((preset) => preset.id);
		await presetsService.delete(presetIDs);

		// Nullify role for users in this role
		const usersService = new UsersService({
			knex: this.knex,
			accountability: this.accountability,
		});
		const usersInRole = await usersService.readByQuery({
			fields: ['id'],
			filter: { role: { _in: keys } },
		});
		const userIDs = usersInRole.map((user) => user.id);
		await usersService.update({ status: 'suspended', role: null }, userIDs);

		await super.delete(key as any);
		return key;
	}
}
