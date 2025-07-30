import type { FlowRaw, OperationRaw } from '@directus/types';
import { z } from 'zod';
import { FlowsService } from '../../../services/flows.js';
import { OperationsService } from '../../../services/operations.js';
import { QuerySchema } from '../schema.js';
import { defineTool } from '../tool.js';

const FlowSchema = z.custom<Partial<FlowRaw>>();
const OperationSchema = z.custom<Partial<OperationRaw>>();

const FlowValidateSchema = z.union([
	z.object({
		action: z.literal('create'),
		data: FlowSchema,
	}),
	z.object({
		action: z.literal('read'),
		query: QuerySchema.optional(),
	}),
	z.object({
		action: z.literal('update'),
		data: FlowSchema,
		key: z.string(),
	}),
	z.object({
		action: z.literal('delete'),
		key: z.string(),
	}),
]);

const FlowInputSchema = z.object({
	action: z.enum(['read', 'create', 'update', 'delete']).describe('The operation to perform'),
	query: QuerySchema.optional().describe(''),
	data: FlowSchema.optional().describe(''),
	key: z.string().optional().describe(''),
});

const OperationValidationSchema = z.union([
	z.object({
		action: z.literal('create'),
		data: OperationSchema,
	}),
	z.object({
		action: z.literal('read'),
		query: QuerySchema.optional(),
	}),
	z.object({
		action: z.literal('update'),
		data: OperationSchema,
		key: z.string(),
	}),
	z.object({
		action: z.literal('delete'),
		key: z.string(),
	}),
]);

const OperationInputSchema = z.object({
	action: z.enum(['read', 'create', 'update', 'delete']).describe('The operation to perform'),
	query: QuerySchema.optional().describe(''),
	data: FlowSchema.optional().describe(''),
	key: z.string().optional().describe(''),
});

export const flows = defineTool<z.infer<typeof FlowValidateSchema>>({
	name: 'flows',
	admin: true,
	description: 'Perform CRUD operations on Directus Flows',
	inputSchema: FlowInputSchema,
	validateSchema: FlowValidateSchema,
	annotations: {
		title: 'Perform CRUD operations on Directus Flows',
	},
	async handler({ args, schema, accountability, sanitizedQuery }) {
		let result = {};

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
			result = await flowsService.readByQuery(sanitizedQuery);

			return {
				type: 'text',
				data: result,
			};
		}

		if (args.action === 'update') {
			const updatedKey = await flowsService.updateOne(args.key, args.data);
			const result = await flowsService.readOne(updatedKey, sanitizedQuery);

			return {
				type: 'text',
				data: result,
			};
		}

		if (args.action === 'delete') {
			await flowsService.deleteOne(args.key);
		}
	},
});

export const operations = defineTool<z.infer<typeof OperationValidationSchema>>({
	name: 'operations',
	admin: true,
	description: 'Perform CRUD operations on Directus Flow Operations',
	inputSchema: OperationInputSchema,
	validateSchema: OperationValidationSchema,
	annotations: {
		title: 'Perform CRUD operations on Directus Flow Operations',
	},
	async handler({ args, schema, accountability, sanitizedQuery }) {
		let result = {};

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
			result = await operationService.readByQuery(sanitizedQuery);

			return {
				type: 'text',
				data: result,
			};
		}

		if (args.action === 'update') {
			const updatedKey = await operationService.updateOne(args.key, args.data);
			const result = await operationService.readOne(updatedKey, sanitizedQuery);

			return {
				type: 'text',
				data: result,
			};
		}

		if (args.action === 'delete') {
			await operationService.deleteOne(args.key);
		}
	},
});

// export const triggerFlow = defineTool<z.infer<typeof ValidateSchema>>({
// 	name: 'trigger-flow',
// 	description: 'Trigger a Directus Flow',
// 	inputSchema: InputSchema,
// 	validateSchema: ValidateSchema,
// 	annotations: {
// 		title: 'Trigger a Directus Flow',
// 	},
// 	async handler({ args, schema, accountability }) {

// 	},
// });
