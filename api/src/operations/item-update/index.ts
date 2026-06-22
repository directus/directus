import { InvalidPayloadError } from '@directus/errors';
import { defineOperationApi } from '@directus/extensions';
import type { Accountability, Item, PrimaryKey } from '@directus/types';
import { optionToObject, toArray } from '@directus/utils';
import { isNil } from 'lodash-es';
import { z } from 'zod';
import { ItemsService } from '../../services/items.js';
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

const inputSchema = z.object({
	keys: z.array(z.union([z.string(), z.number()])).nullable(),
	query: z.record(z.string(), z.any()).nullable(),
	payload: z.union([z.record(z.string(), z.any()), z.array(z.record(z.string(), z.any()))]).nullable(),
});

export default defineOperationApi<Options>({
	id: 'item-update',
	handler: async (
		{ collection, key, payload, query, emitEvents, permissions },
		{ accountability, database, getSchema },
	) => {
		const payloadObject: Partial<Item> | Partial<Item>[] | null = optionToObject(payload) ?? null;
		const queryObject = query ? optionToObject(query) : null;
		const keys = isNil(key) ? null : toArray(key);

		// Without a payload there is nothing to update, so this is a no-op
		if (!payloadObject) {
			return null;
		}

		const validation = inputSchema.safeParse({ keys, query: queryObject, payload: payloadObject });

		if (!validation.success) {
			throw new InvalidPayloadError({ reason: validation.error.issues[0]?.message ?? 'Invalid input' });
		}

		const hasKeys = keys !== null && keys.length > 0;
		const hasQuery = queryObject !== null;

		if (hasKeys && hasQuery) {
			throw new InvalidPayloadError({ reason: 'Cannot use both "keys" and "query"' });
		}

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
			schema,
			accountability: customAccountability,
			knex: database,
		});

		let result: PrimaryKey | PrimaryKey[] | null;

		if (Array.isArray(payloadObject)) {
			result = await itemsService.updateBatch(payloadObject, { emitEvents: !!emitEvents });
		} else if (hasQuery) {
			const sanitizedQueryObject = await sanitizeQuery(queryObject, schema, customAccountability);
			result = await itemsService.updateByQuery(sanitizedQueryObject, payloadObject, { emitEvents: !!emitEvents });
		} else {
			const updated = await itemsService.updateMany(keys ?? [], payloadObject, { emitEvents: !!emitEvents });

			// Ensure scalar return for single-key updates (previously updateOne)
			result = keys !== null && keys.length === 1 ? keys[0]! : updated;
		}

		return result;
	},
});
