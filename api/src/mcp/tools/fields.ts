import { InvalidPayloadError } from '@directus/errors';
import type { Field, Item } from '@directus/types';
import { toArray } from '@directus/utils';
import { z } from 'zod';
import { FieldsService } from '../../services/fields.js';
import { defineTool } from '../define.js';
import { FieldItemSchema } from '../schema.js';
import prompts from './prompts/index.js';

export const FieldBaseValidateSchema = z.strictObject({
	collection: z.string(),
});

export const FieldValidateSchema = z.union([
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

export const FieldInputSchema = z.strictObject({
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
			await service.createField(args.collection, args.data as Field);

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
			const data = toArray(args.data as Field);

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
