import { PrimaryKey } from '@directus/shared/types';
import { defineOperationApi, toArray } from '@directus/shared/utils';
import { ItemsService } from '../../services';
import { Item } from '../../types';

type Options = {
	mode: 'one' | 'many';
	collection: string;
	payload: string;
	emitEvents: boolean;
};

export default defineOperationApi<Options>({
	id: 'write',

	handler: async ({ mode, collection, payload, emitEvents }, { accountability, database, getSchema }) => {
		const itemsService = new ItemsService(collection, {
			schema: await getSchema({ database }),
			accountability,
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
