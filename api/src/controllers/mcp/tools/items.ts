import type { PrimaryKey, Query } from '@directus/types';
import { z } from 'zod';
import { ItemsService } from '../../../services/items.js';
import { defineTool } from '../tool.js';

export default defineTool<{ action: string; collection: string; query: Query; keys?: PrimaryKey[] }>('items', {
	description: '',
	inputSchema: z.object({
		action: z.enum(['read']),
		collection: z.string(),
		query: z.record(z.any()),
		keys: z.optional(z.array(z.any())),
	}),
	annotations: {
		title: 'ping pong!',
	},
	async handler({ args, schema, accountability }) {
		let result = {};

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
			message: 'pong',
		};
	},
});
