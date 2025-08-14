import type { FlowRaw } from '@directus/types';
import { z } from 'zod';
import { FlowsService } from '../../services/flows.js';
import { defineTool } from '../define.js';
import { OperationItemSchema, QueryInputSchema, QueryValidateSchema } from '../schema.js';
import prompts from './prompts/index.js';

export const FlowItemSchema = z.strictObject({
	id: z.string(),
	name: z.string(),
	icon: z.union([z.string(), z.null()]),
	color: z.union([z.string(), z.null()]),
	description: z.union([z.string(), z.null()]),
	status: z.enum(['active', 'inactive']),
	trigger: z.union([z.enum(['event', 'schedule', 'operation', 'webhook', 'manual']), z.null()]),
	options: z.union([z.record(z.string(), z.any()), z.null()]),
	operation: z.union([z.string(), z.null()]),
	operations: z.array(OperationItemSchema),
	date_created: z.string(),
	user_created: z.string(),
	accountability: z.union([z.enum(['all', 'activity']), z.null()]),
});

export const FlowValidateSchema = z.union([
	z.strictObject({
		action: z.literal('create'),
		data: FlowItemSchema,
	}),
	z.strictObject({
		action: z.literal('read'),
		query: QueryValidateSchema.optional(),
	}),
	z.strictObject({
		action: z.literal('update'),
		data: FlowItemSchema,
		key: z.string(),
	}),
	z.strictObject({
		action: z.literal('delete'),
		key: z.string(),
	}),
]);

export const FlowInputSchema = z.strictObject({
	action: z.enum(['read', 'create', 'update', 'delete']).describe('The operation to perform'),
	query: QueryInputSchema.optional().describe(''),
	data: FlowItemSchema.optional().describe(''),
	key: z.string().optional().describe(''),
});

export const flows = defineTool<z.infer<typeof FlowValidateSchema>>({
	name: 'flows',
	admin: true,
	description: prompts.flows,
	inputSchema: FlowInputSchema,
	validateSchema: FlowValidateSchema,
	annotations: {
		title: 'Perform CRUD operations on Directus Flows',
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
				data: result ?? null,
			};
		}

		if (args.action === 'read') {
			const result = await flowsService.readByQuery(sanitizedQuery);

			return {
				type: 'text',
				data: result,
			};
		}

		if (args.action === 'update') {
			const updatedKey = await flowsService.updateOne(args.key, args.data as FlowRaw);
			const result = await flowsService.readOne(updatedKey, sanitizedQuery);

			return {
				type: 'text',
				data: result,
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
