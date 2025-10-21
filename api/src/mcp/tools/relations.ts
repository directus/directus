import { InvalidPayloadError } from '@directus/errors';
import type { Relation } from '@directus/types';
import { z } from 'zod';
import { RelationsService } from '../../services/relations.js';
import { defineTool } from '../define.js';
import {
	RelationItemInputSchema,
	RelationItemValidateCreateSchema,
	RelationItemValidateUpdateSchema,
} from '../schema.js';
import prompts from './prompts/index.js';

const RelationsValidateSchema = z.discriminatedUnion('action', [
	z.object({
		action: z.literal('create'),
		collection: z.string(),
		field: z.string().optional(),
		data: RelationItemValidateCreateSchema,
	}),
	z.object({
		action: z.literal('read'),
		collection: z.string().optional(),
		field: z.string().optional(),
	}),
	z.object({
		action: z.literal('update'),
		collection: z.string(),
		field: z.string(),
		data: RelationItemValidateUpdateSchema,
	}),
	z.object({
		action: z.literal('delete'),
		collection: z.string(),
		field: z.string(),
	}),
]);

const RelationsInputSchema = z.object({
	action: z.enum(['create', 'read', 'update', 'delete']).describe('The operation to perform'),
	collection: z.string().describe('The name of the collection (required for create, update, delete)').optional(),
	field: z.string().describe('The name of the field (required for create, update, delete)').optional(),
	data: RelationItemInputSchema.optional().describe('The relation data. (required for create, update)'),
});

export const relations = defineTool<z.infer<typeof RelationsValidateSchema>>({
	name: 'relations',
	admin: true,
	description: prompts.relations,
	annotations: {
		title: 'Directus - Relations',
	},
	inputSchema: RelationsInputSchema,
	validateSchema: RelationsValidateSchema,
	async handler({ args, schema, accountability }) {
		const service = new RelationsService({
			schema,
			accountability,
		});

		if (args.action === 'create') {
			await service.createOne(args.data as Partial<Relation>);

			const result = await service.readOne(args.collection, args.field || args.data.field);

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
			await service.updateOne(args.collection, args.field, args.data as Partial<Relation>);

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
