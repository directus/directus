import { InvalidPayloadError } from '@directus/errors';
import type { Collection, Field, Item, Relation, SnapshotRelation } from '@directus/types';
import { toArray } from '@directus/utils';
import { z } from 'zod';
import { CollectionsService } from '../../services/collections.js';
import { FieldsService } from '../../services/fields.js';
import { RelationsService } from '../../services/relations.js';
import { getSnapshot } from '../../utils/get-snapshot.js';
import { defineTool } from '../tool.js';
import prompts from './prompts/index.js';

export interface fieldOverviewOutput {
	name: string;
	type: string;
	primary_key?: boolean;
	required?: boolean;
	readonly?: boolean;
	note?: string;
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

const OverviewValidateSchema = z.object({
	action: z.literal('overview'),
});

const OverviewInputSchema = z.object({
	action: z.literal('overview'),
});

export const schema = defineTool<z.infer<typeof OverviewValidateSchema>>({
	name: 'schema',
	admin: true,
	description: prompts.schema,
	inputSchema: OverviewInputSchema,
	validateSchema: OverviewValidateSchema,
	async handler() {
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

			if (field.meta.note) {
				fieldOverview.note = field.meta.note;
			}

			if (field.meta.interface) {
				fieldOverview.interface = {
					type: field.meta.interface,
				};

				if (field.meta.options?.['choices']) {
					fieldOverview.interface.choices = field.meta.options['choices'];
				}
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
	},
});

const CollectionItemSchema = z.custom<Collection>();

const CollectionValidateSchema = z.union([
	z.object({
		action: z.literal('create'),
		data: z.union([z.array(CollectionItemSchema), CollectionItemSchema]),
	}),
	z.object({
		action: z.literal('read'),
		keys: z.array(z.string()).optional(),
	}),
	z.object({
		action: z.literal('update'),
		data: z.union([z.array(CollectionItemSchema), CollectionItemSchema]),
	}),
	z.object({
		action: z.literal('delete'),
		keys: z.array(z.string()),
	}),
]);

const CollectionInputSchema = z.object({
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
			const data = toArray(args.data);

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
			const updatedKeys = await service.updateBatch(toArray(args.data));

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

const FieldItemSchema = z.custom<Field>();

const FieldBaseValidateSchema = z.object({
	collection: z.string(),
});

const FieldValidateSchema = z.union([
	FieldBaseValidateSchema.extend({
		action: z.literal('create'),
		data: FieldItemSchema,
	}),
	FieldBaseValidateSchema.extend({
		action: z.literal('read'),
		field: z.string().optional(),
	}),
	FieldBaseValidateSchema.extend({
		action: z.literal('update'),
		data: z.union([z.array(FieldItemSchema), FieldItemSchema]),
	}),
	FieldBaseValidateSchema.extend({
		action: z.literal('delete'),
		field: z.string(),
	}),
]);

const FieldInputSchema = z.object({
	action: z.enum(['read', 'create', 'update', 'delete']).describe('The operation to perform'),
	collection: z.string().describe('The name of the collection'),
	field: z.string().describe(''),
	data: z
		.union([z.array(FieldItemSchema), FieldItemSchema])
		.optional()
		.describe(''),
});

export const field = defineTool<z.infer<typeof FieldValidateSchema>>({
	name: 'fields',
	admin: true,
	description: prompts.fields,
	inputSchema: FieldInputSchema,
	validateSchema: FieldValidateSchema,
	async handler({ args, schema, accountability }) {
		const service = new FieldsService({
			schema,
			accountability,
		});

		if (args.action === 'create') {
			await service.createField(args.collection, args.data);

			const result = await service.readOne(args.collection, args.data.field);

			return {
				type: 'text',
				data: result || null,
			};
		}

		if (args.action === 'read') {
			let result = null;

			if (args.field) {
				result = await service.readOne(args.collection, args.field);
			} else {
				result = await service.readAll(args.collection);
			}

			return {
				type: 'text',
				data: result,
			};
		}

		if (args.action === 'update') {
			const data = toArray(args.data);

			await service.updateFields(args.collection, data);

			const result: Item[] = [];

			for (const field of data) {
				const updatedField = await service.readOne(args.collection, field.field);
				result.push(updatedField);
			}

			return {
				type: 'text',
				data: result,
			};
		}

		if (args.action === 'delete') {
			const { collection, field } = args;
			await service.deleteField(collection, field);

			return {
				type: 'text',
				data: { collection, field },
			};
		}

		throw new InvalidPayloadError({ reason: 'Invalid action' });
	},
});

const RelationItemSchema = z.custom<Relation>();

const RelationBaseValidateSchema = z.object({
	collection: z.string(),
});

const RelationValidateSchema = z.union([
	RelationBaseValidateSchema.extend({
		action: z.literal('create'),
		data: RelationItemSchema,
	}),
	RelationBaseValidateSchema.extend({
		action: z.literal('read'),
		field: z.string().optional(),
	}),
	RelationBaseValidateSchema.extend({
		action: z.literal('update'),
		field: z.string(),
		data: RelationItemSchema,
	}),
	RelationBaseValidateSchema.extend({
		action: z.literal('delete'),
		field: z.string(),
	}),
]);

const RelationInputSchema = z.object({
	action: z.enum(['read', 'create', 'update', 'delete']).describe('The operation to perform'),
	collection: z.string().describe('The name of the collection'),
	field: z.string().describe(''),
	data: z
		.union([z.array(FieldItemSchema), FieldItemSchema])
		.optional()
		.describe(''),
});

export const relation = defineTool<z.infer<typeof RelationValidateSchema>>({
	name: 'relations',
	admin: true,
	description: prompts.relations,
	inputSchema: RelationInputSchema,
	validateSchema: RelationValidateSchema,
	async handler({ args, schema, accountability }) {
		const service = new RelationsService({
			schema,
			accountability,
		});

		if (args.action === 'create') {
			await service.createOne(args.data);

			const result = await service.readOne(args.collection, args.data.field);

			return {
				type: 'text',
				data: result || null,
			};
		}

		if (args.action === 'read') {
			let result = null;

			if (args.field) {
				result = await service.readOne(args.collection, args.field);
			} else {
				result = await service.readAll();
			}

			return {
				type: 'text',
				data: result,
			};
		}

		if (args.action === 'update') {
			await service.updateOne(args.collection, args.field, args.data);

			const result = await service.readOne(args.collection, args.field);

			return {
				type: 'text',
				data: result,
			};
		}

		if (args.action === 'delete') {
			const { collection, field } = args;
			await service.deleteOne(collection, field);

			return {
				type: 'text',
				data: { collection, field },
			};
		}

		throw new InvalidPayloadError({ reason: 'Invalid action' });
	},
});
