import type { Collection, Field, Relation } from '@directus/types';
import { getRelationType } from '@directus/utils';
import { z } from 'zod';
import { getSnapshot } from '../../../utils/get-snapshot.js';
import { PrimaryKeySchema, QuerySchema } from '../schema.js';
import { defineTool } from '../tool.js';
import { items } from './items.js';

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
	description: '',
	inputSchema: InputSchema,
	validateSchema: ValidateSchema,
	async handler({ args, schema, accountability }) {
		if (args.action !== 'overview') {
			let collection = 'directus_collections';

			if (args.type === 'field') {
				collection = 'directus_fields';
			} else if (args.type === 'relation') {
				collection = 'directus_relations';
			}

			return items.handler({
				args: {
					collection,
					...args,
				},
				schema,
				accountability,
			});
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
