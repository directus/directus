import { Accountability, PrimaryKey } from '@directus/shared/types';
import { defineOperationApi, toArray } from '@directus/shared/utils';
import { ItemsService } from '../../services';
import { Item } from '../../types';
import { getAccountabilityForRole } from '../../utils/get-accountability-for-role';
import { parseJSON } from '../../utils/parse-json';

type Options = {
	mode: 'one' | 'many' | 'query';
	collection: string;
	key: PrimaryKey | PrimaryKey[] | null;
	payload: string;
	query: string;
	permissions: string; // $public, $trigger, $full, or UUID of a role
};

export default defineOperationApi<Options>({
	id: 'item-update',

	handler: async ({ mode, collection, key, payload, query, permissions }, { accountability, database, getSchema }) => {
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

		const itemsService: ItemsService = new ItemsService(collection, {
			schema: await getSchema({ database }),
			accountability: customAccountability,
			knex: database,
		});

		let result: PrimaryKey | PrimaryKey[] | null;

		const parsedPayload: Partial<Item> | Partial<Item>[] | null =
			typeof payload === 'string' ? parseJSON(payload) : null;

		if (!parsedPayload) {
			return null;
		}

		if (mode === 'one') {
			if (!key) return null;
			result = await itemsService.updateOne(toArray(key)[0] as PrimaryKey, parsedPayload);
		} else if (mode === 'many') {
			if (!key) return null;
			result = await itemsService.updateMany(toArray(key) as PrimaryKey[], parsedPayload);
		} else {
			result = await itemsService.updateByQuery(query ? parseJSON(query) : {}, parsedPayload);
		}

		return result;
	},
});
