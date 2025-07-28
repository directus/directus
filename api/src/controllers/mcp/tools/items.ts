import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import { isSystemCollection } from '@directus/system-data';
import type { Item, PrimaryKey, Query } from '@directus/types';
import { z } from 'zod';
import { ItemsService } from '../../../services/items.js';
import { sanitizeQuery } from '../../../utils/sanitize-query.js';
import { defineTool } from '../tool.js';

const ItemSchema = z.custom<Partial<Item>>();

const PartialItemInput = z.object({
	collection: z.string(),
});

const QuerySchema = z.custom<Query>();
const PrimaryKeySchema = z.custom<PrimaryKey>();

const ItemInputSchema = z.union([
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
		data: z.array(PrimaryKeySchema).optional(),
		keys: z.array(PrimaryKeySchema).optional(),
		query: QuerySchema.optional(),
	}),
]);

export const items = defineTool<z.infer<typeof ItemInputSchema>>('items', {
	description: 'Perform CRUD operations on Directus Items',
	inputSchema: ItemInputSchema,
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

		if (isSingleton && args.action === 'create') {
			throw new Error('Cannot create singleton');
		}

		let sanitizedQuery = {};

		if (args.query) {
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
			const savedKeys: PrimaryKey[] = [];

			if (Array.isArray(args.data)) {
				const keys = await itemsService.createMany(args.data);
				savedKeys.push(...keys);
			} else {
				const key = await itemsService.createOne(args.data);
				savedKeys.push(key);
			}

			if (Array.isArray(args.data)) {
				result = await itemsService.readMany(savedKeys, sanitizedQuery);
			} else {
				result = await itemsService.readOne(savedKeys[0]!, sanitizedQuery);
			}

			return {
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
				data: result,
			};
		}

		if (args.action === 'update') {
			if (isSingleton) {
				await itemsService.upsertSingleton(args.data);

				const item = await itemsService.readSingleton(sanitizedQuery);

				return {
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
				data: result,
			};
		}

		if (args.action === 'delete') {
			if (Array.isArray(args.data)) {
				await itemsService.deleteMany(args.data);
			} else if (args.keys) {
				await itemsService.deleteMany(args.keys);
			} else {
				await itemsService.deleteByQuery(sanitizedQuery);
			}

			return;
		}

		return;
	},
});
