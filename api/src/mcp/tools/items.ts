import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import { isSystemCollection } from '@directus/system-data';
import type { PrimaryKey } from '@directus/types';
import { toArray } from '@directus/utils';
import { z } from 'zod';
import { ItemsService } from '../../services/items.js';
import {
	ItemInputSchema,
	ItemValidateSchema,
	PartialItemInputSchema,
	PrimaryKeyInputSchema,
	PrimaryKeyValidateSchema,
	QueryInputSchema,
	QueryValidateSchema,
} from '../schema.js';
import { defineTool } from '../tool.js';
import prompts from './prompts/index.js';

const ValidateSchema = z.union([
	PartialItemInputSchema.extend({
		action: z.literal('create'),
		data: z.union([z.array(ItemValidateSchema), ItemValidateSchema]),
		query: QueryValidateSchema.optional(),
	}),
	PartialItemInputSchema.extend({
		action: z.literal('read'),
		keys: z.array(PrimaryKeyValidateSchema).optional(),
		query: QueryValidateSchema.optional(),
	}),
	PartialItemInputSchema.extend({
		action: z.literal('update'),
		data: ItemValidateSchema,
		keys: z.array(PrimaryKeyValidateSchema).optional(),
		query: QueryValidateSchema.optional(),
	}),
	PartialItemInputSchema.extend({
		action: z.literal('delete'),
		keys: z.array(PrimaryKeyValidateSchema),
	}),
]);

const InputSchema = z.object({
	action: z.enum(['read', 'create', 'update', 'delete']).describe('The operation to perform'),
	collection: z.string().describe('The name of the collection'),
	query: QueryInputSchema.optional().describe(''),
	keys: z.array(PrimaryKeyInputSchema).optional().describe(''),
	data: z
		.union([z.array(ItemInputSchema), ItemInputSchema])
		.optional()
		.describe(''),
});

export const items = defineTool<z.infer<typeof ValidateSchema>>({
	name: 'items',
	description: prompts.items,
	inputSchema: InputSchema,
	validateSchema: ValidateSchema,
	annotations: {
		title: 'Perform CRUD operations on Directus Items',
	},
	async handler({ args, schema, accountability, sanitizedQuery }) {
		if (isSystemCollection(args.collection)) {
			throw new InvalidPayloadError({ reason: 'Cannot provide a core collection' });
		}

		if (args.collection in schema.collections === false) {
			throw new ForbiddenError();
		}

		const isSingleton = schema.collections[args.collection]?.singleton ?? false;

		const itemsService = new ItemsService(args.collection, {
			schema,
			accountability,
		});

		if (args.action === 'create') {
			const data = toArray(args.data);

			if (isSingleton) {
				await itemsService.upsertSingleton(args.data);

				const item = await itemsService.readSingleton(sanitizedQuery);

				return {
					type: 'text',
					data: item || null,
				};
			}

			const savedKeys = await itemsService.createMany(data);

			const result = await itemsService.readMany(savedKeys, sanitizedQuery);

			return {
				type: 'text',
				data: result || null,
			};
		}

		if (args.action === 'read') {
			let result = null;

			if (isSingleton) {
				result = await itemsService.readSingleton(sanitizedQuery);
			} else if (args.keys) {
				result = await itemsService.readMany(args.keys, sanitizedQuery);
			} else {
				result = await itemsService.readByQuery(sanitizedQuery);
			}

			return {
				type: 'text',
				data: result,
			};
		}

		if (args.action === 'update') {
			if (isSingleton) {
				await itemsService.upsertSingleton(args.data);

				const item = await itemsService.readSingleton(sanitizedQuery);

				return {
					type: 'text',
					data: item || null,
				};
			}

			let updatedKeys: PrimaryKey[] = [];

			if (Array.isArray(args.data)) {
				updatedKeys = await itemsService.updateBatch(args.data);
			} else if (args.keys) {
				updatedKeys = await itemsService.updateMany(args.keys, args.data);
			} else {
				updatedKeys = await itemsService.updateByQuery(sanitizedQuery, args.data);
			}

			const result = await itemsService.readMany(updatedKeys, sanitizedQuery);

			return {
				type: 'text',
				data: result,
			};
		}

		if (args.action === 'delete') {
			const deletedKeys = await itemsService.deleteMany(args.keys);

			return {
				type: 'text',
				data: deletedKeys,
			};
		}

		throw new Error('Invalid action.');
	},
});
