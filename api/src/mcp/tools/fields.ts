import { InvalidPayloadError } from '@directus/errors';
import type { Item } from '@directus/types';
import { toArray } from '@directus/utils';
import { z } from 'zod';
import { FieldsService } from '../../services/fields.js';
import { defineTool } from '../define.js';
import {
	FieldItemInputSchema,
	FieldItemValidateSchema,
	RawFieldItemInputSchema,
	RawFieldItemValidateSchema,
} from '../schema.js';
import prompts from './prompts/index.js';

export const FieldsBaseValidateSchema = z.strictObject({
	collection: z.string(),
});

export const FieldsValidateSchema = z.union([
	FieldsBaseValidateSchema.extend({
		action: z.literal('create'),
		data: FieldItemValidateSchema,
	}),
	z.object({
		action: z.literal('read'),
		collection: z.string().optional(),
		field: z.string().optional(),
	}),
	FieldsBaseValidateSchema.extend({
		action: z.literal('update'),
		data: z.union([z.array(RawFieldItemValidateSchema), RawFieldItemValidateSchema]),
	}),
	FieldsBaseValidateSchema.extend({
		action: z.literal('delete'),
		field: z.string(),
	}),
]);

export const FieldsInputSchema = z.object({
	action: z.enum(['read', 'create', 'update', 'delete']).describe('The operation to perform'),
	collection: z.string().describe('The name of the collection').optional(),
	field: z.string().optional(),
	data: z
		.union([
			z.array(FieldItemInputSchema),
			FieldItemInputSchema,
			z.array(RawFieldItemInputSchema),
			RawFieldItemInputSchema,
		])
		.optional(),
});

export const fields = defineTool<z.infer<typeof FieldsValidateSchema>>({
	name: 'fields',
	admin: true,
	description: prompts.fields,
	inputSchema: FieldsInputSchema,
	validateSchema: FieldsValidateSchema,
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

			if (args.collection) {
				if (args.field) {
					result = await service.readOne(args.collection, args.field);
				} else {
					result = await service.readAll(args.collection);
				}
			} else {
				result = await service.readAll();
			}

			return {
				type: 'text',
				data: result || null,
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
				data: result || null,
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
