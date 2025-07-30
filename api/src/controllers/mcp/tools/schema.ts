import type { Collection, Field, PrimaryKey, Relation } from '@directus/types';
import { getRelationType, toArray } from '@directus/utils';
import { z } from 'zod';
import { ItemsService } from '../../../services/items.js';
import { getSnapshot } from '../../../utils/get-snapshot.js';
import { PrimaryKeySchema, QuerySchema } from '../schema.js';
import { defineTool } from '../tool.js';

const CollectionItemSchema = z.custom<Collection>();

const CollectionValidateSchema = z.union([
	z.object({
		type: z.literal('collection'),
		action: z.literal('create'),
		data: z.union([z.array(CollectionItemSchema), CollectionItemSchema]),
		query: QuerySchema.optional(),
	}),
	z.object({
		type: z.literal('collection'),
		action: z.literal('read'),
		keys: z.array(PrimaryKeySchema).optional(),
		query: QuerySchema.optional(),
	}),
	z.object({
		type: z.literal('collection'),
		action: z.literal('update'),
		data: CollectionItemSchema,
		keys: z.array(PrimaryKeySchema).optional(),
		query: QuerySchema.optional(),
	}),
	z.object({
		type: z.literal('collection'),
		action: z.literal('delete'),
		keys: z.array(PrimaryKeySchema),
	}),
]);

const FieldItemSchema = z.custom<Field>();

const FieldValidateSchema = z.union([
	z.object({
		type: z.literal('field'),
		action: z.literal('create'),
		data: z.union([z.array(FieldItemSchema), FieldItemSchema]),
		query: QuerySchema.optional(),
	}),
	z.object({
		type: z.literal('field'),
		action: z.literal('read'),
		keys: z.array(PrimaryKeySchema).optional(),
		query: QuerySchema.optional(),
	}),
	z.object({
		type: z.literal('field'),
		action: z.literal('update'),
		data: FieldItemSchema,
		keys: z.array(PrimaryKeySchema).optional(),
		query: QuerySchema.optional(),
	}),
	z.object({
		type: z.literal('field'),
		action: z.literal('delete'),
		keys: z.array(PrimaryKeySchema),
	}),
]);

const RelationItemSchema = z.custom<Relation>();

const RelationValidateSchema = z.union([
	z.object({
		type: z.literal('relation'),
		action: z.literal('create'),
		data: z.union([z.array(RelationItemSchema), RelationItemSchema]),
		query: QuerySchema.optional(),
	}),
	z.object({
		type: z.literal('relation'),
		action: z.literal('read'),
		keys: z.array(PrimaryKeySchema).optional(),
		query: QuerySchema.optional(),
	}),
	z.object({
		type: z.literal('relation'),
		action: z.literal('update'),
		data: RelationItemSchema,
		keys: z.array(PrimaryKeySchema).optional(),
		query: QuerySchema.optional(),
	}),
	z.object({
		type: z.literal('relation'),
		action: z.literal('delete'),
		keys: z.array(PrimaryKeySchema),
	}),
	z.object({
		type: z.literal('relation'),
		action: z.literal('overview'),
	}),
]);

const ValidateSchema = z.union([CollectionValidateSchema, FieldValidateSchema, RelationValidateSchema]);

const InputSchema = z.object({
	type: z.enum(['collection', 'field', 'relation']),
	action: z.enum(['read', 'create', 'update', 'delete', 'overview']).describe('The operation to perform'),
	query: QuerySchema.optional().describe(''),
	keys: z.array(PrimaryKeySchema).optional().describe(''),
	data: z
		.union([
			z.array(CollectionValidateSchema),
			CollectionValidateSchema,
			z.array(FieldItemSchema),
			FieldItemSchema,
			z.array(RelationItemSchema),
			RelationItemSchema,
		])
		.optional()
		.describe(''),
});

export const schema = defineTool<z.infer<typeof ValidateSchema>>({
	name: 'schema',
	admin: true,
	description:
		'Manage Directus system schema elements such as collections, fields, and relations, or retrieve an overview snapshot of the current schema configuration.\n\n### 🧱 Types\n• `collection` – Represents entries from `directus_collections`\n• `field` – Represents field definitions in `directus_fields`\n• `relation` – Represents data model relations via `directus_relations`\n\n### ⚙️ Actions\n• `create` – Add new schema definitions (e.g., a new field or relation)\n• `read` – Fetch one or more schema items using keys or filters\n• `update` – Modify existing schema entries by key or query\n• `delete` – Remove schema entries using keys\n• `overview` – Return a full schema snapshot across collections, fields, and relations\n\n### 📘 Usage Details\n- CRUD operations are handled via the `ItemsService` for the corresponding system collection based on `type`\n- The `overview` action bypasses the ItemsService and returns a pre-processed summary using `getSnapshot()`\n- `data` can be a single object or an array (for create/update)\n- `keys` can be one or more item IDs (primary keys)\n- `filter`, `sort`, `limit`, and `offset` follow standard Directus query conventions\n\n### 🔍 Overview Snapshot\nThe `overview` action returns an object with the following structure:\n```json\n{\n  "collections": ["articles", "categories", ...],\n  "fields": [\n    {\n      "name": "title",\n      "collection": "articles",\n      "type": "string",\n      "meta": { "required": true, "readonly": false }\n    }\n  ],\n  "relations": [\n    {\n      "field": "category",\n      "collection": "articles",\n      "type": "many_to_one"\n    }\n  ]\n}\n```\n\nThis is useful for tooling that needs a real-time schema map (e.g., for custom form builders or DX automation).',
	inputSchema: InputSchema,
	validateSchema: ValidateSchema,
	async handler({ args, schema, accountability, sanitizedQuery }) {
		if (args.action !== 'overview') {
			let collection = 'directus_collections';

			if (args.type === 'field') {
				collection = 'directus_fields';
			} else if (args.type === 'relation') {
				collection = 'directus_relations';
			}

			const service = new ItemsService(collection, {
				schema,
				accountability,
			});

			if (args.action === 'create') {
				const data = toArray(args.data);

				const savedKeys = await service.createMany(data);

				const result = await service.readMany(savedKeys, sanitizedQuery);

				return {
					type: 'text',
					data: result || null,
				};
			}

			if (args.action === 'read') {
				let result = null;

				if (args.keys) {
					result = await service.readMany(args.keys, sanitizedQuery);
				} else {
					result = await service.readByQuery(sanitizedQuery);
				}

				return {
					type: 'text',
					data: result,
				};
			}

			if (args.action === 'update') {
				let updatedKeys: PrimaryKey[] = [];

				if (Array.isArray(args.data)) {
					updatedKeys = await service.updateBatch(args.data);
				} else if (args.keys) {
					updatedKeys = await service.updateMany(args.keys, args.data);
				} else {
					updatedKeys = await service.updateByQuery(sanitizedQuery, args.data);
				}

				const result = await service.readMany(updatedKeys, sanitizedQuery);

				return {
					type: 'text',
					data: result,
				};
			}

			if (args.action === 'delete') {
				await service.deleteMany(args.keys);
			}
		} else {
			const snapshot = await getSnapshot();

			return {
				type: 'text',
				data: {
					collections: snapshot.collections.map(({ collection }) => collection),
					fields: snapshot.fields.map(({ field, collection, type, meta }) => ({
						name: field,
						collection,
						type,
						meta: {
							required: meta.required,
							readonly: meta.readonly,
						},
					})),
					relations: snapshot.relations.map((relation) => ({
						field: relation.field,
						collection: relation.collection,
						type: getRelationType({ relation, collection: relation.collection, field: relation.field }),
					})),
				},
			};
		}
	},
});
