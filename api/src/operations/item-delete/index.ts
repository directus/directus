import { defineOperationApi } from '@directus/extensions';
import type { Accountability, PrimaryKey } from '@directus/types';
import { optionToObject, toArray } from '@directus/utils';
import { ItemsService } from '../../services/items.js';
import { getAccountabilityForRole } from '../../utils/get-accountability-for-role.js';
import { sanitizeQuery } from '../../utils/sanitize-query.js';

type Options = {
	collection: string;
	key?: PrimaryKey | PrimaryKey[] | null;
	query?: Record<string, any> | string | null;
	emitEvents: boolean;
	permissions: string; // $public, $trigger, $full, or UUID of a role
};

export default defineOperationApi<Options>({
	id: 'item-delete',

	handler: async ({ collection, key, query, emitEvents, permissions }, { accountability, database, getSchema }) => {
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

		const queryObject = query ? optionToObject(query) : {};
		const sanitizedQueryObject = sanitizeQuery(queryObject, customAccountability);

		let result: PrimaryKey | PrimaryKey[] | null;

		if (!key || (Array.isArray(key) && key.length === 0)) {
			result = await itemsService.deleteByQuery(sanitizedQueryObject, { emitEvents: !!emitEvents });
		} else {
			const keys = toArray(key);

			if (keys.length === 1) {
				result = await itemsService.deleteOne(keys[0]!, { emitEvents: !!emitEvents });
			} else {
				result = await itemsService.deleteMany(keys, { emitEvents: !!emitEvents });
			}
		}

		return result;
	},
});
