import { InvalidPayloadError } from '@directus/errors';
import type { Relation } from '@directus/types';
import { z } from 'zod';
import { RelationsService } from '../../services/relations.js';
import { defineTool } from '../define.js';
import { RelationItemSchema } from '../schema.js';
import prompts from './prompts/index.js';

export const RelationBaseValidateSchema = z.strictObject({
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

const RelationInputSchema = z.strictObject({
	action: z.enum(['read', 'create', 'update', 'delete']).describe('The operation to perform'),
	collection: z.string().describe('The name of the collection'),
	field: z.string().describe(''),
	data: z
		.union([z.array(RelationItemSchema), RelationItemSchema])
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
			await service.createOne(args.data as Partial<Relation>);

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
			await service.updateOne(args.collection, args.field, args.data as Partial<Relation>);

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
