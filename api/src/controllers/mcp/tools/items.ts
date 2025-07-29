import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import { isSystemCollection } from '@directus/system-data';
import type { PrimaryKey } from '@directus/types';
import { toArray } from '@directus/utils';
import { z } from 'zod';
import { ItemsService } from '../../../services/items.js';
import { sanitizeQuery } from '../../../utils/sanitize-query.js';
import { ItemSchema, PartialItemInput, PrimaryKeySchema, QuerySchema } from '../schema.js';
import { defineTool } from '../tool.js';

const ValidateSchema = z.union([
	PartialItemInput.extend({
		action: z.literal('create'),
		data: z.union([z.array(ItemSchema), ItemSchema]),
		query: QuerySchema.optional(),
	}),
	PartialItemInput.extend({
		action: z.literal('read'),
		keys: z.array(PrimaryKeySchema).optional(),
		query: QuerySchema.optional(),
	}),
	PartialItemInput.extend({
		action: z.literal('update'),
		data: ItemSchema,
		keys: z.array(PrimaryKeySchema).optional(),
		query: QuerySchema.optional(),
	}),
	PartialItemInput.extend({
		action: z.literal('delete'),
		keys: z.array(PrimaryKeySchema),
	}),
]);

const InputSchema = z.object({
	action: z.enum(['read', 'create', 'update', 'delete']).describe('The operation to perform'),
	collection: z.string().describe('The name of the collection'),
	query: QuerySchema.optional().describe(''),
	keys: z.array(PrimaryKeySchema).optional().describe(''),
	data: z
		.union([z.array(ItemSchema), ItemSchema])
		.optional()
		.describe(''),
});

export const items = defineTool<z.infer<typeof ValidateSchema>>({
	name: 'items',
	description: 'Perform CRUD operations on Directus Items',
	inputSchema: InputSchema,
	validateSchema: ValidateSchema,
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

		let sanitizedQuery = {};

		if ('query' in args && args.query) {
			sanitizedQuery = await sanitizeQuery(
				{
					fields: args.query['fields'] || '*',
					...args.query,
				},
				schema,
				accountability || null,
			);
		}

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
				updatedKeys = await itemsService.updateMany(args.keys, sanitizedQuery, args.data);
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
			await itemsService.deleteMany(args.keys);
		}
	},
});
