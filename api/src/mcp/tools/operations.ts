import type { OperationRaw } from '@directus/types';
import { z } from 'zod';
import { OperationsService } from '../../services/operations.js';
import { defineTool } from '../define.js';
import { OperationItemSchema, QueryInputSchema, QueryValidateSchema } from '../schema.js';
import { FlowItemSchema } from './flows.js';
import prompts from './prompts/index.js';

export const OperationValidationSchema = z.union([
	z.strictObject({
		action: z.literal('create'),
		data: OperationItemSchema,
	}),
	z.strictObject({
		action: z.literal('read'),
		query: QueryValidateSchema.optional(),
	}),
	z.strictObject({
		action: z.literal('update'),
		data: OperationItemSchema,
		key: z.string(),
	}),
	z.strictObject({
		action: z.literal('delete'),
		key: z.string(),
	}),
]);

export const OperationInputSchema = z.strictObject({
	action: z.enum(['read', 'create', 'update', 'delete']).describe('The operation to perform'),
	query: QueryInputSchema.optional().describe(''),
	data: FlowItemSchema.optional().describe('Flow data as a native object or array (NOT stringified JSON)'),
	key: z.string().optional().describe(''),
});

export const operations = defineTool<z.infer<typeof OperationValidationSchema>>({
	name: 'operations',
	admin: true,
	description: prompts.operations,
	inputSchema: OperationInputSchema,
	validateSchema: OperationValidationSchema,
	annotations: {
		title: 'Perform CRUD operations on Directus Flow Operations',
	},
	async handler({ args, schema, accountability, sanitizedQuery }) {
		const operationService = new OperationsService({
			schema,
			accountability,
		});

		if (args.action === 'create') {
			const savedKey = await operationService.createOne(args.data);
			const result = await operationService.readOne(savedKey);

			return {
				type: 'text',
				data: result ?? null,
			};
		}

		if (args.action === 'read') {
			const result = await operationService.readByQuery(sanitizedQuery);

			return {
				type: 'text',
				data: result,
			};
		}

		if (args.action === 'update') {
			const updatedKey = await operationService.updateOne(args.key, args.data as OperationRaw);
			const result = await operationService.readOne(updatedKey, sanitizedQuery);

			return {
				type: 'text',
				data: result,
			};
		}

		if (args.action === 'delete') {
			const deletedKey = await operationService.deleteOne(args.key);

			return {
				type: 'text',
				data: deletedKey,
			};
		}

		throw new Error('Invalid action.');
	},
});
