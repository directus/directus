import { InvalidPayloadError } from '@directus/errors';
import type { Collection, RawCollection } from '@directus/types';
import { toArray } from '@directus/utils';
import { z } from 'zod';
import { CollectionsService } from '../../services/collections.js';
import { defineTool } from '../define.js';
import { CollectionItemSchema } from '../schema.js';
import prompts from './prompts/index.js';

export const CollectionValidateSchema = z.union([
	z.strictObject({
		action: z.literal('create'),
		data: z.union([z.array(CollectionItemSchema), CollectionItemSchema]),
	}),
	z.strictObject({
		action: z.literal('read'),
		keys: z.array(z.string()).optional(),
	}),
	z.strictObject({
		action: z.literal('update'),
		data: z.union([z.array(CollectionItemSchema), CollectionItemSchema]),
	}),
	z.strictObject({
		action: z.literal('delete'),
		keys: z.array(z.string()),
	}),
]);

export const CollectionInputSchema = z.strictObject({
	action: z.enum(['read', 'create', 'update', 'delete']).describe('The operation to perform'),
	keys: z.array(z.string()).optional().describe(''),
	data: z
		.union([z.array(CollectionItemSchema), CollectionItemSchema])
		.optional()
		.describe(''),
});

export const collection = defineTool<z.infer<typeof CollectionValidateSchema>>({
	name: 'collections',
	admin: true,
	description: prompts.collections,
	inputSchema: CollectionInputSchema,
	validateSchema: CollectionValidateSchema,
	async handler({ args, schema, accountability }) {
		const service = new CollectionsService({
			schema,
			accountability,
		});

		if (args.action === 'create') {
			const data = toArray(args.data as RawCollection);

			const savedKeys = await service.createMany(data);

			const result = await service.readMany(savedKeys);

			return {
				type: 'text',
				data: result || null,
			};
		}

		if (args.action === 'read') {
			let result = null;

			if (args.keys) {
				result = await service.readMany(args.keys);
			} else {
				result = await service.readByQuery();
			}

			return {
				type: 'text',
				data: result,
			};
		}

		if (args.action === 'update') {
			const updatedKeys = await service.updateBatch(toArray(args.data as Collection));

			const result = await service.readMany(updatedKeys);

			return {
				type: 'text',
				data: result,
			};
		}

		if (args.action === 'delete') {
			const deletedKeys = await service.deleteMany(args.keys);

			return {
				type: 'text',
				data: deletedKeys,
			};
		}

		throw new InvalidPayloadError({ reason: 'Invalid action' });
	},
});
