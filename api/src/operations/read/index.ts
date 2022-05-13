import { PrimaryKey, Accountability } from '@directus/shared/types';
import { defineOperationApi, toArray } from '@directus/shared/utils';
import { ItemsService } from '../../services';
import { Item } from '../../types';
import { getPermissions } from '../../utils/get-permissions';
import { InvalidConfigException } from '../../exceptions';

type Options = {
	mode: 'one' | 'many' | 'query';
	collection: string;
	key: PrimaryKey | PrimaryKey[] | null;
	query: string;
	permissions: string; // $public, $trigger, $full, or UUID of a role
};

export default defineOperationApi<Options>({
	id: 'read',

	handler: async ({ mode, collection, key, query, permissions }, { accountability, database, getSchema }) => {
		const schema = await getSchema({ database });

		let customAccountability: Accountability | null = accountability;

		if (permissions === '$public') {
			customAccountability = {
				role: null,
				user: null,
				admin: false,
				app: false,
			};

			customAccountability.permissions = await getPermissions(customAccountability, schema);
		}

		if (permissions === '$full') {
			customAccountability = null;
		}

		if (permissions && permissions.startsWith('$') === false) {
			const role = await database
				.select(['app_access', 'admin_access'])
				.from('directus_roles')
				.where({ id: permissions })
				.first();

			if (!role) {
				throw new InvalidConfigException(`Configured role "${permissions}" isn't a valid role ID or doesn't exist.`);
			}

			customAccountability = {
				role: permissions,
				user: null,
				admin: role.admin_access === 1 || role.admin_access === '1' || role.admin_access === true,
				app: role.app_access === 1 || role.app_access === '1' || role.app_access === true,
			};

			customAccountability.permissions = await getPermissions(customAccountability, schema);
		}

		const itemsService = new ItemsService(collection, {
			schema,
			accountability: customAccountability,
			knex: database,
		});

		let result: Item | Item[] | null;

		if (mode === 'one') {
			if (!key) result = null;
			else result = await itemsService.readOne(toArray(key)[0], query ? JSON.parse(query) : {});
		} else if (mode === 'many') {
			if (!key) result = null;
			else result = await itemsService.readMany(toArray(key) as PrimaryKey[], query ? JSON.parse(query) : {});
		} else {
			result = await itemsService.readByQuery(query ? JSON.parse(query) : {});
		}

		return result;
	},
});
