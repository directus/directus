import { InvalidPayloadError } from '@directus/errors';
import { defineOperationApi } from '@directus/extensions';
import type { Accountability, PrimaryKey } from '@directus/types';
import { optionToObject, toArray } from '@directus/utils';
import { z } from 'zod';
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

const inputSchema = z.object({
	keys: z.array(z.union([z.string(), z.number()])).nullable(),
	query: z.record(z.string(), z.any()).nullable(),
});

export default defineOperationApi<Options>({
	id: 'item-delete',
	handler: async ({ collection, key, query, emitEvents, permissions }, { accountability, database, getSchema }) => {
		const queryObject = query ? optionToObject(query) : null;
		const keys = key == null ? null : toArray(key);

		const validation = inputSchema.safeParse({ keys, query: queryObject });

		if (!validation.success) {
			throw new InvalidPayloadError({ reason: validation.error.issues[0]?.message ?? 'Invalid input' });
		}

		const hasKeys = keys !== null && keys.length > 0;
		const hasEmptyKeys = keys !== null && keys.length === 0;
		const hasQuery = queryObject !== null;

		if (hasKeys && hasQuery) {
			throw new InvalidPayloadError({ reason: 'Cannot use both "keys" and "query"' });
		}

		if (keys === null && !hasQuery) {
			throw new InvalidPayloadError({ reason: 'Must provide "keys" or "query"' });
		}

		if (hasEmptyKeys && !hasQuery) {
			throw new InvalidPayloadError({ reason: '"keys" cannot be empty' });
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

		if (hasQuery) {
			const sanitizedQueryObject = await sanitizeQuery(queryObject, schema, customAccountability);
			result = await itemsService.deleteByQuery(sanitizedQueryObject, { emitEvents: !!emitEvents });
		} else {
			const deleted = await itemsService.deleteMany(keys ?? [], { emitEvents: !!emitEvents });

			// Ensure scalar return for single-key deletes (previously deleteOne)
			result = keys !== null && keys.length === 1 ? keys[0]! : deleted;
		}

		return result;
	},
});
