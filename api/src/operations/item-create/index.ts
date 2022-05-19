import { Accountability, PrimaryKey } from '@directus/shared/types';
import { defineOperationApi, toArray } from '@directus/shared/utils';
import { ItemsService } from '../../services';
import { Item } from '../../types';
import { getAccountabilityForRole } from '../../utils/get-accountability-for-role';
import { parseJSON } from '../../utils/parse-json';

type Options = {
	collection: string;
	payload: string;
	emitEvents: boolean;
	permissions: string; // $public, $trigger, $full, or UUID of a role
};

export default defineOperationApi<Options>({
	id: 'item-create',

	handler: async ({ collection, payload, emitEvents, permissions }, { accountability, database, getSchema }) => {
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
			schema: await getSchema({ database }),
			accountability: customAccountability,
			knex: database,
		});

		let result: PrimaryKey[] | null;

		const parsedPayload: Partial<Item> | Partial<Item>[] | null =
			typeof payload === 'string' ? parseJSON(payload) : null;

		if (!parsedPayload) {
			result = null;
		} else {
			result = await itemsService.createMany(toArray(parsedPayload), { emitEvents });
		}

		return result;
	},
});
