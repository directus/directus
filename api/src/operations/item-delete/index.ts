import { Accountability, PrimaryKey } from '@directus/shared/types';
import { defineOperationApi, toArray } from '@directus/shared/utils';
import { ItemsService } from '../../services';
import { getAccountabilityForRole } from '../../utils/get-accountability-for-role';
import { optionToObject } from '../../utils/operation-options';
import { sanitizeQuery } from '../../utils/sanitize-query';

type Options = {
	collection: string;
	key?: PrimaryKey | PrimaryKey[] | null;
	query?: Record<string, any> | string | null;
	permissions: string; // $public, $trigger, $full, or UUID of a role
};

export default defineOperationApi<Options>({
	id: 'item-delete',

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

		const itemsService: ItemsService = new ItemsService(collection, {
			schema: await getSchema({ database }),
			accountability: customAccountability,
			knex: database,
		});

		const queryObject = query ? optionToObject(query) : {};
		const sanitizedQueryObject = sanitizeQuery(queryObject, customAccountability);

		let result: PrimaryKey | PrimaryKey[] | null;

		if (!key) {
			result = await itemsService.deleteByQuery(sanitizedQueryObject);
		} else {
			const keys = toArray(key);

			if (keys.length === 1) {
				result = await itemsService.deleteOne(keys[0]);
			} else {
				result = await itemsService.deleteMany(keys);
			}
		}

		return result;
	},
});
