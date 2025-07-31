import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import { isSystemCollection } from '@directus/system-data';
import type { PrimaryKey } from '@directus/types';
import { toArray } from '@directus/utils';
import { z } from 'zod';
import { ItemsService } from '../../services/items.js';
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
	description:
		'Perform Create, Read, Update, Delete, and Upsert operations on items in any Directus collection. This tool provides full access to collection data with support for advanced filtering, relational queries, sorting, pagination, and efficient batch operations.\n\n### ⚙️ Available Actions\n• read - Fetch items with flexible filtering, pagination, and field selection\n• create - Add new items to a collection\n• update - Modify existing items (requires `id`)\n• delete - Remove items by `id`\n• upsert - Create or update based on primary key presence\n\n### 📘 Usage Patterns\n\n#### 🔍 READ\n- Use the `fields` parameter to specify exactly which fields to return\n- Use dot notation for relational fields (e.g., [\'title\', \'author.name\', \'category.slug\'])\n- Apply `filter` to target specific items and reduce data transfer\n- Use `limit` and `offset` for pagination\n- Sort using `sort`, e.g., [\'date_created\', \'-title\']\n\n#### 🧪 Common Filter Examples\n```json\n{ "status": { "_eq": "published" } }\n{ "status": { "_in": ["published", "draft"] } }\n{ "title": { "_icontains": "welcome" } }\n{ "price": { "_gte": 10, "_lte": 100 } }\n{ "date_created": { "_gte": "2024-01-01" } }\n{ "featured_image": { "_nnull": true } }\n{ "author.status": { "_eq": "active" } }\n{ "_or": [{ "status": { "_eq": "published" } }, { "featured": { "_eq": true } }] }\n{ "_and": [{ "status": { "_eq": "published" } }, { "date_created": { "_gte": "2024-01-01" } }] }\n{ "_and": [{ "status": { "_eq": "published" } }, { "_or": [{ "featured": { "_eq": true } }] }] }\n```\n\n#### ✏️ CREATE\n- Provide complete item data using the `data` or `item` parameter\n- Use `fields` to specify what should be returned\n- Returns the created item with ID\n\n#### 🔁 UPDATE\n- Requires both `id` and `data`\n- Supports partial updates\n- Use `fields` to control the response\n\n#### ❌ DELETE\n- Requires only the `id`\n- This is destructive — use with caution\n\n#### 🔄 UPSERT\n- Provide full item via `data` or `item`\n- If primary key exists, performs update; otherwise, inserts new\n- Ideal for import/sync scenarios\n\n### ⚡ Performance Tips\n- Always use `fields` to reduce payload size\n- Apply `filter` to limit results\n- Prefer targeted queries over broad fetches',
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
			await itemsService.deleteMany(args.keys);
		}

		throw new Error('Invalid action.');
	},
});
