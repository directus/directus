import { Accountability, PrimaryKey } from '@directus/shared/types';
import { defineOperationApi, toArray } from '@directus/shared/utils';
import { ItemsService } from '../../services';
import { Item } from '../../types';
import { getAccountabilityForRole } from '../../utils/get-accountability-for-role';
import { parseJSON } from '../../utils/parse-json';

type Options = {
	collection: string;
	key: PrimaryKey | PrimaryKey[] | null;
	query: string;
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

		let result: Item | Item[] | null;

		const parsedQuery = query ? parseJSON(query) : {};

		if (key === null) {
			result = await itemsService.readByQuery(parsedQuery);
		} else {
			const keys = toArray(key);

			if (keys.length === 1) {
				result = await itemsService.readOne(keys[0], parsedQuery);
			} else {
				result = await itemsService.readMany(keys, parsedQuery);
			}
		}

		return result;
	},
});
