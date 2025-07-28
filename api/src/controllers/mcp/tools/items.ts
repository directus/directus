import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import { isSystemCollection } from '@directus/system-data';
import type { PrimaryKey, Query } from '@directus/types';
import { z } from 'zod';
import { ItemsService } from '../../../services/items.js';
import { defineTool } from '../tool.js';

export const item = defineTool<{ action: string; collection: string; query: Query; keys?: PrimaryKey[] }>('items', {
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

		if (args.action === 'read') {
			const itemsService = new ItemsService(args.collection, {
				schema,
				accountability,
			});

			if (args.keys) {
				result = await itemsService.readMany(args.keys, args.query);
			} else {
				result = await itemsService.readByQuery(args.query);
			}
		}

		return {
			data: result,
		};
	},
});
