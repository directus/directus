import { Accountability, PrimaryKey } from '@directus/shared/types';
import { defineOperationApi, toArray } from '@directus/shared/utils';
import { ItemsService } from '../../services';
import { getAccountabilityForRole } from '../../utils/get-accountability-for-role';
import { parseJSON } from '../../utils/parse-json';

type Options = {
	mode: 'one' | 'many' | 'query';
	collection: string;
	key: PrimaryKey | PrimaryKey[] | null;
	query: string;
	permissions: string; // $public, $trigger, $full, or UUID of a role
};

export default defineOperationApi<Options>({
	id: 'delete',

	handler: async ({ mode, collection, key, query, permissions }, { accountability, database, getSchema }) => {
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

		if (mode === 'one') {
			if (!key) return null;
			result = await itemsService.deleteOne(toArray(key)[0] as PrimaryKey);
		} else if (mode === 'many') {
			if (!key) return null;
			result = await itemsService.deleteMany(toArray(key) as PrimaryKey[]);
		} else {
			result = await itemsService.deleteByQuery(query ? parseJSON(query) : {});
		}

		return result;
	},
});
