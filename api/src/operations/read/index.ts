import { PrimaryKey } from '@directus/shared/types';
import { defineOperationApi, toArray } from '@directus/shared/utils';
import { ItemsService } from '../../services';
import { Item } from '../../types';

type Options = {
	mode: 'one' | 'many' | 'query';
	collection: string;
	key: PrimaryKey | PrimaryKey[] | null;
	query: string;
};

export default defineOperationApi<Options>({
	id: 'read',

	handler: async ({ mode, collection, key, query }, { accountability, database, getSchema }) => {
		const itemsService = new ItemsService(collection, {
			schema: await getSchema({ database }),
			accountability,
			knex: database,
		});

		let result: Item | Item[] | null;

		if (mode === 'one') {
			if (!key) result = null;
			else result = await itemsService.readOne(toArray(key)[0], JSON.parse(query));
		} else if (mode === 'many') {
			if (!key) result = null;
			else result = await itemsService.readMany(toArray(key) as PrimaryKey[], JSON.parse(query));
		} else {
			result = await itemsService.readByQuery(JSON.parse(query));
		}

		return result;
	},
});
