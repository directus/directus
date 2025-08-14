import { InvalidPayloadError } from '@directus/errors';
import { z } from 'zod';
import { RelationsService } from '../../services/relations.js';
import { defineTool } from '../define.js';
import { RelationItemSchema, RelationItemValidateCreateSchema, RelationItemValidateUpdateSchema } from '../schema.js';
import prompts from './prompts/index.js';

export const RelationBaseValidateSchema = z.strictObject({
	collection: z.string(),
});

const RelationsValidateSchema = z.union([
	RelationBaseValidateSchema.extend({
		action: z.literal('create'),
		data: RelationItemValidateCreateSchema,
	}),
	z.object({
		action: z.literal('read'),
		collection: z.string().optional(),
		field: z.string().optional(),
	}),
	RelationBaseValidateSchema.extend({
		action: z.literal('update'),
		field: z.string(),
		data: RelationItemValidateUpdateSchema,
	}),
	RelationBaseValidateSchema.extend({
		action: z.literal('delete'),
		field: z.string(),
	}),
]);

const RelationsInputSchema = z.object({
	action: z.enum(['read', 'create', 'update', 'delete']).describe('The operation to perform'),
	collection: z.string().describe('The name of the collection'),
	field: z.string(),
	data: z.union([z.array(RelationItemSchema), RelationItemSchema]).optional(),
});

export const relation = defineTool<z.infer<typeof RelationsValidateSchema>>({
	name: 'relations',
	admin: true,
	description: prompts.relations,
	inputSchema: RelationsInputSchema,
	validateSchema: RelationsValidateSchema,
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

			if (args.field && args.collection) {
				result = await service.readOne(args.collection, args.field);
			} else if (args.collection) {
				result = await service.readAll(args.collection);
			} else {
				result = await service.readAll();
			}

			return {
				type: 'text',
				data: result || null,
			};
		}

		if (args.action === 'update') {
			await service.updateOne(args.collection, args.field, args.data);

			const result = await service.readOne(args.collection, args.field);

			return {
				type: 'text',
				data: result || null,
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
