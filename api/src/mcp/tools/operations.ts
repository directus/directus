import type { OperationRaw } from '@directus/types';
import { z } from 'zod';
import { OperationsService } from '../../services/operations.js';
import { defineTool } from '../define.js';
import { OperationItemValidateSchema, QueryInputSchema, QueryValidateSchema } from '../schema.js';
import { FlowsInputSchema } from './flows.js';
import prompts from './prompts/index.js';

export const OperationsValidationSchema = z.discriminatedUnion('action', [
	z.strictObject({
		action: z.literal('create'),
		data: OperationItemValidateSchema,
	}),
	z.strictObject({
		action: z.literal('read'),
		query: QueryValidateSchema.optional(),
	}),
	z.strictObject({
		action: z.literal('update'),
		data: OperationItemValidateSchema,
		key: z.string(),
	}),
	z.strictObject({
		action: z.literal('delete'),
		key: z.string(),
	}),
]);

export const OperationsInputSchema = z.object({
	action: z.enum(['create', 'read', 'update', 'delete']).describe('The operation to perform'),
	query: QueryInputSchema.optional(),
	data: FlowsInputSchema.optional().describe('Flow data as a native object or array (NOT stringified JSON)'),
	key: z.string().optional(),
});

export const operations = defineTool<z.infer<typeof OperationsValidationSchema>>({
	name: 'operations',
	admin: true,
	description: prompts.operations,
	inputSchema: OperationsInputSchema,
	validateSchema: OperationsValidationSchema,
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
				data: result || null,
			};
		}

		if (args.action === 'read') {
			const result = await operationService.readByQuery(sanitizedQuery);

			return {
				type: 'text',
				data: result || null,
			};
		}

		if (args.action === 'update') {
			const updatedKey = await operationService.updateOne(args.key, args.data as OperationRaw);
			const result = await operationService.readOne(updatedKey, sanitizedQuery);

			return {
				type: 'text',
				data: result || null,
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
