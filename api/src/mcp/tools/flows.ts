import type { FlowRaw } from '@directus/types';
import { isObject } from '@directus/utils';
import { z } from 'zod';
import { FlowsService } from '../../services/flows.js';
import { defineTool } from '../define.js';
import { FlowItemInputSchema, FlowItemValidateSchema, QueryInputSchema, QueryValidateSchema } from '../schema.js';
import prompts from './prompts/index.js';

export const FlowsValidateSchema = z.discriminatedUnion('action', [
	z.strictObject({
		action: z.literal('create'),
		data: FlowItemValidateSchema,
	}),
	z.strictObject({
		action: z.literal('read'),
		query: QueryValidateSchema.optional(),
	}),
	z.strictObject({
		action: z.literal('update'),
		key: z.string(),
		data: FlowItemValidateSchema,
		query: QueryValidateSchema.optional(),
	}),
	z.strictObject({
		action: z.literal('delete'),
		key: z.string(),
	}),
]);

export const FlowsInputSchema = z.object({
	action: z.enum(['create', 'read', 'update', 'delete']).describe('The operation to perform'),
	query: QueryInputSchema.optional(),
	data: FlowItemInputSchema.optional(),
	key: z.string().optional(),
});

export const flows = defineTool<z.infer<typeof FlowsValidateSchema>>({
	name: 'flows',
	admin: true,
	description: prompts.flows,
	annotations: {
		title: 'Directus - Flows',
	},
	inputSchema: FlowsInputSchema,
	validateSchema: FlowsValidateSchema,
	endpoint({ data }) {
		if (!isObject(data) || !('id' in data)) {
			return;
		}

		return ['settings', 'flows', data['id'] as string];
	},
	async handler({ args, schema, accountability, sanitizedQuery }) {
		const flowsService = new FlowsService({
			schema,
			accountability,
		});

		if (args.action === 'create') {
			const savedKey = await flowsService.createOne(args.data);
			const result = await flowsService.readOne(savedKey);

			return {
				type: 'text',
				data: result || null,
			};
		}

		if (args.action === 'read') {
			const result = await flowsService.readByQuery(sanitizedQuery);

			return {
				type: 'text',
				data: result || null,
			};
		}

		if (args.action === 'update') {
			const updatedKey = await flowsService.updateOne(args.key, args.data as Partial<FlowRaw>);
			const result = await flowsService.readOne(updatedKey, sanitizedQuery);

			return {
				type: 'text',
				data: result || null,
			};
		}

		if (args.action === 'delete') {
			const deletedKey = await flowsService.deleteOne(args.key);

			return {
				type: 'text',
				data: deletedKey,
			};
		}

		throw new Error('Invalid action.');
	},
});
