import { defineOperationApi } from '@directus/extensions';
import type { Accountability, PrimaryKey } from '@directus/types';
import { optionToObject, toArray } from '@directus/utils';
import { ItemsService } from '../../services/items.js';
import type { Item } from '../../types/index.js';
import { getAccountabilityForRole } from '../../utils/get-accountability-for-role.js';
import { sanitizeQuery } from '../../utils/sanitize-query.js';

type Options = {
	collection: string;
	key?: PrimaryKey | PrimaryKey[] | null;
	payload?: Record<string, any> | string | null;
	query?: Record<string, any> | string | null;
	emitEvents: boolean;
	permissions: string; // $public, $trigger, $full, or UUID of a role
};

export default defineOperationApi<Options>({
	id: 'item-update',

	handler: async (
		{ collection, key, payload, query, emitEvents, permissions },
		{ accountability, database, getSchema },
	) => {
		const schema = await getSchema({ database });
		let customAccountability: Accountability | null;

		if (!permissions || permissions === '$trigger') {
			customAccountability = accountability;
		} else if (permissions === '$full') {
			customAccountability = await getAccountabilityForRole('system', { database, schema, accountability });
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

		const payloadObject: Partial<Item> | Partial<Item>[] | null = optionToObject(payload) ?? null;

		const queryObject = query ? optionToObject(query) : {};
		const sanitizedQueryObject = sanitizeQuery(queryObject, customAccountability);

		if (!payloadObject) {
			return null;
		}

		let result: PrimaryKey | PrimaryKey[] | null;

		if (!key || (Array.isArray(key) && key.length === 0)) {
			result = await itemsService.updateByQuery(sanitizedQueryObject, payloadObject, { emitEvents: !!emitEvents });
		} else {
			const keys = toArray(key);

			if (keys.length === 1) {
				result = await itemsService.updateOne(keys[0]!, payloadObject, { emitEvents: !!emitEvents });
			} else {
				result = await itemsService.updateMany(keys, payloadObject, { emitEvents: !!emitEvents });
			}
		}

		return result;
	},
});
