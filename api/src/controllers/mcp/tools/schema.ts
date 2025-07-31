import type { Collection, Field, PrimaryKey, Relation } from '@directus/types';
import { toArray } from '@directus/utils';
import { z } from 'zod';
import { ItemsService } from '../../../services/items.js';
import type { SnapshotRelation } from '../../../types/snapshot.js';
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

const OverviewValidateSchema = z.object({
	type: z.literal('overview'),
});

const ValidateSchema = z.union([
	CollectionValidateSchema,
	FieldValidateSchema,
	RelationValidateSchema,
	OverviewValidateSchema,
]);

const InputSchema = z.object({
	type: z.enum(['collection', 'field', 'relation', 'overview']),
	action: z.enum(['read', 'create', 'update', 'delete']).optional().describe('The operation to perform'),
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

export interface fieldOverviewOutput {
	name: string;
	type: string;
	primary_key?: boolean;
	required?: boolean;
	readonly?: boolean;
	interface?: {
		type: string;
		choices?: Array<string | number>;
	};
	relation?: {
		type: string;
		related_collections: string[];
	};
}

export interface OverviewOutput {
	[collection: string]: {
		[field: string]: fieldOverviewOutput;
	};
}

export const schema = defineTool<z.infer<typeof ValidateSchema>>({
	name: 'schema',
	admin: true,
	description:
		'Manage Directus system schema elements such as collections, fields, and relations, or retrieve an overview snapshot of the current schema configuration.\n\n### 🧱 Types\n• `collection` – Represents entries from `directus_collections`\n• `field` – Represents field definitions in `directus_fields`\n• `relation` – Represents data model relations via `directus_relations`\n\n### ⚙️ Actions\n• `create` – Add new schema definitions (e.g., a new field or relation)\n• `read` – Fetch one or more schema items using keys or filters\n• `update` – Modify existing schema entries by key or query\n• `delete` – Remove schema entries using keys\n• `overview` – Return a full schema snapshot across collections, fields, and relations\n\n### 📘 Usage Details\n- CRUD operations are handled via the `ItemsService` for the corresponding system collection based on `type`\n- The `overview` action bypasses the ItemsService and returns a pre-processed summary using `getSnapshot()`\n- `data` can be a single object or an array (for create/update)\n- `keys` can be one or more item IDs (primary keys)\n- `filter`, `sort`, `limit`, and `offset` follow standard Directus query conventions\n\n### 🔍 Overview Snapshot\nThe `overview` action returns an object with the following structure:\n```json\n{\n  "collections": ["articles", "categories", ...],\n  "fields": [\n    {\n      "name": "title",\n      "collection": "articles",\n      "type": "string",\n      "meta": { "required": true, "readonly": false }\n    }\n  ],\n  "relations": [\n    {\n      "field": "category",\n      "collection": "articles",\n      "type": "many_to_one"\n    }\n  ]\n}\n```\n\nThis is useful for tooling that needs a real-time schema map (e.g., for custom form builders or DX automation).',
	inputSchema: InputSchema,
	validateSchema: ValidateSchema,
	async handler({ args, schema, accountability, sanitizedQuery }) {
		if (args.type !== 'overview') {
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

			const overview: OverviewOutput = {};

			const relations: { [collection: string]: SnapshotRelation } = {};

			snapshot.relations.forEach((relation) => {
				relations[relation.collection] = relation;
			});

			snapshot.fields.forEach((field) => {
				// Skip UI-only fields
				if (field.type === 'alias' && field.meta?.special?.includes('no-data')) return;

				if (!overview[field.collection]) {
					overview[field.collection] = {};
				}

				const fieldOverview: fieldOverviewOutput = {
					name: field.field,
					type: field.type,
				};

				if (field.schema?.is_primary_key) {
					fieldOverview.primary_key = field.schema?.is_primary_key;
				}

				if (field.meta.required) {
					fieldOverview.required = field.meta.required;
				}

				if (field.meta.readonly) {
					fieldOverview.readonly = field.meta.readonly;
				}

				if (field.meta.interface) {
					fieldOverview.interface = {
						type: field.meta.interface,
					};
				}

				const relation = relations[field.collection] as SnapshotRelation | undefined;

				if (field.meta?.special && relation) {
					let type;

					if (field.meta.special.includes('m2o') || field.meta.special.includes('file')) {
						type = 'm2o';
					} else if (field.meta.special.includes('o2m')) {
						type = 'o2m';
					} else if (field.meta.special.includes('m2m') || field.meta.special.includes('files')) {
						type = 'm2m';
					} else if (field.meta.special.includes('m2a')) {
						type = 'm2a';
					}

					if (type) {
						let relatedCollections: string[] = [];

						if (relation.related_collection) {
							relatedCollections.push(relation.related_collection);
						} else if (type === 'm2a' && relation.meta.one_allowed_collections) {
							relatedCollections = relation.meta.one_allowed_collections;
						}

						fieldOverview.relation = {
							type,
							related_collections: relatedCollections,
						};
					}
				}

				overview[field.collection]![field.field] = fieldOverview;
			});

			return {
				type: 'text',
				data: overview,
			};
		}
	},
});
