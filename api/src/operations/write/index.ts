import { Accountability, PrimaryKey } from '@directus/shared/types';
import { defineOperationApi, toArray } from '@directus/shared/utils';
import { InvalidConfigException } from '../../exceptions';
import { ItemsService } from '../../services';
import { Item } from '../../types';
import { getPermissions } from '../../utils/get-permissions';

type Options = {
	mode: 'one' | 'many';
	collection: string;
	payload: string;
	emitEvents: boolean;
	permissions: string; // $public, $trigger, $full, or UUID of a role
};

export default defineOperationApi<Options>({
	id: 'write',

	handler: async ({ mode, collection, payload, emitEvents, permissions }, { accountability, database, getSchema }) => {
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
			schema: await getSchema({ database }),
			accountability: customAccountability,
			knex: database,
		});

		let result: PrimaryKey | PrimaryKey[] | null;
		const parsedPayload: Partial<Item> | Partial<Item>[] | null = isJsonParsed(payload) ? JSON.parse(payload) : null;

		if (mode === 'one') {
			if (!parsedPayload) result = null;
			else result = await itemsService.upsertOne(toArray(parsedPayload)[0], { emitEvents });
		} else {
			if (!parsedPayload) result = null;
			else result = await itemsService.upsertMany(toArray(parsedPayload), { emitEvents });
		}

		return result;

		function isJsonParsed(value: any) {
			try {
				JSON.parse(value);
				return true;
			} catch {
				return false;
			}
		}
	},
});
