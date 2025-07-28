import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import { isSystemCollection } from '@directus/system-data';
import type { PrimaryKey, Query } from '@directus/types';
import { z } from 'zod';
import { ItemsService } from '../../../services/items.js';
import { sanitizeQuery } from '../../../utils/sanitize-query.js';
import { defineTool } from '../tool.js';

export const items = defineTool<{ action: string; collection: string; query: Query; keys?: PrimaryKey[] }>('items', {
	description: 'Perform CRUD operations on Directus Items',
	inputSchema: z.object({
		action: z.enum(['read']),
		collection: z.string(),
		query: z.record(z.any()),
		// keys: z.optional(z.array())),
	}),
	annotations: {
		title: 'Perform CRUD operations on Directus Items',
	},
	async handler({ args, schema, accountability }) {
		let result = {};

		if (isSystemCollection(args.collection)) {
			throw new InvalidPayloadError({ reason: 'Cannot provide a core collection' });
		}

		if (args.collection in schema.collections === false) {
			throw new ForbiddenError();
		}

		const isSingleton = schema.collections[args.collection]?.singleton ?? false;

		const query = await sanitizeQuery(
			{
				fields: args.query['fields'] || '*',
				...args.query,
			},
			schema,
			accountability || null,
		);

		if (args.action === 'read') {
			const itemsService = new ItemsService(args.collection, {
				schema,
				accountability,
			});

			if (isSingleton) {
				result = await itemsService.readSingleton(query);
			} else if (args.keys) {
				result = await itemsService.readMany(args.keys, query);
			} else {
				result = await itemsService.readByQuery(query);
			}
		}

		return {
			data: result,
		};
	},
});
