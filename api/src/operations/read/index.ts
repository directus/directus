import { PrimaryKey } from '@directus/shared/types';
import { defineOperationApi } from '@directus/shared/utils';
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

		let result: Item | Item[];

		if (mode === 'one') {
			result = await itemsService.readOne(key as PrimaryKey, JSON.parse(query));
		} else if (mode === 'many') {
			result = await itemsService.readMany(key as PrimaryKey[], JSON.parse(query));
		} else {
			result = await itemsService.readByQuery(JSON.parse(query));
		}

		return result;
	},
});
