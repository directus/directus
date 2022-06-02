import { Accountability, PrimaryKey } from '@directus/shared/types';
import { defineOperationApi, toArray } from '@directus/shared/utils';
import { ItemsService } from '../../services';
import { Item } from '../../types';
import { optionToObject } from '../../utils/operation-options';
import { getAccountabilityForRole } from '../../utils/get-accountability-for-role';

type Options = {
	collection: string;
	key?: PrimaryKey | PrimaryKey[] | null;
	query?: Record<string, any> | string | null;
	permissions: string; // $public, $trigger, $full, or UUID of a role
};

export default defineOperationApi<Options>({
	id: 'item-read',

	handler: async ({ collection, key, query, permissions }, { accountability, database, getSchema }) => {
		const schema = await getSchema({ database });

		let customAccountability: Accountability | null;

		if (!permissions || permissions === '$trigger') {
			customAccountability = accountability;
		} else if (permissions === '$full') {
			customAccountability = null;
		} else if (permissions === '$public') {
			customAccountability = await getAccountabilityForRole(null, { database, schema, accountability });
		} else {
			customAccountability = await getAccountabilityForRole(permissions, { database, schema, accountability });
		}

		const itemsService = new ItemsService(collection, {
			schema,
			accountability: customAccountability,
			knex: database,
		});

		const queryObject = query ? optionToObject(query) : {};

		let result: Item | Item[] | null;

		if (!key) {
			result = await itemsService.readByQuery(queryObject);
		} else {
			const keys = toArray(key);

			if (keys.length === 1) {
				result = await itemsService.readOne(keys[0], queryObject);
			} else {
				result = await itemsService.readMany(keys, queryObject);
			}
		}

		return result;
	},
});
