import type { FlowRaw, OperationRaw } from '@directus/types';
import { z } from 'zod';
import { getFlowManager } from '../../flows.js';
import { FlowsService } from '../../services/flows.js';
import { OperationsService } from '../../services/operations.js';
import { QuerySchema } from '../schema.js';
import { defineTool } from '../tool.js';
import prompts from './prompts/index.js';

const FlowSchema = z.custom<Partial<FlowRaw>>();

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
			const updatedKey = await flowsService.updateOne(args.key, args.data);
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

const OperationSchema = z.custom<Partial<OperationRaw>>();

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
	data: FlowSchema.optional().describe('Flow data as a native object or array (NOT stringified JSON)'),
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
			const updatedKey = await operationService.updateOne(args.key, args.data);
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

const TriggerFlowInputSchema = z.object({
	flowDefinition: z.record(z.string(), z.any()).describe('The full flow definition from the read-flows call.'),
	flowId: z.string().describe('The ID of the flow to trigger'),
	method: z.enum(['GET', 'POST']).default('GET').describe(''),
	query: QuerySchema.optional().describe(''),
	headers: z.record(z.string(), z.any()).optional().describe(''),
	collection: z.string().describe('The collection of the items to trigger the flow on.'),
	keys: z
		.array(z.string())
		.describe(
			'The primary keys of the items to trigger the flow on. If the flow requireSelection field is true, you must provide the keys.',
		),
	data: z
		.record(z.string(), z.any())
		.optional()
		.describe(
			'The data to pass to the flow. Should be an object with keys that match the flow *options.fields.fields* property',
		),
});

export const triggerFlow = defineTool<z.infer<typeof TriggerFlowInputSchema>>({
	name: 'trigger-flow',
	description: prompts.triggerFlow,
	inputSchema: TriggerFlowInputSchema,
	// validateSchema: TriggerFlowInputSchema,
	annotations: {
		title: 'Trigger a Directus Flow',
	},
	async handler({ args, schema, accountability }) {
		const { flowDefinition, flowId, collection, keys, data, method, query, headers } = args;

		// Validate flow existence
		if (!flowDefinition) {
			throw new Error('Flow definition must be provided');
		}

		// Validate flow ID matches
		if (flowDefinition['id'] !== flowId) {
			throw new Error(`Flow ID mismatch: provided ${flowId} but definition has ${flowDefinition['id']}`);
		}

		// Validate collection is valid for this flow
		if (!flowDefinition['options']['collections'].includes(collection)) {
			throw new Error(
				`Invalid collection "${collection}". This flow only supports: ${flowDefinition['options']['collections'].join(
					', ',
				)}`,
			);
		}

		// Check if selection is required
		const requiresSelection = flowDefinition['options']['requireSelection'] !== false;

		if (requiresSelection && (!keys || keys.length === 0)) {
			throw new Error('This flow requires selecting at least one item, but no keys were provided');
		}

		// Validate required fields
		if (flowDefinition['options']['fields']) {
			const requiredFields = flowDefinition['options']['fields']
				.filter((field: any) => field.meta?.required)
				.map((field: any) => field.field);

			for (const fieldName of requiredFields) {
				if (!data || !(fieldName in data)) {
					throw new Error(`Missing required field: ${fieldName}`);
				}
			}
		}

		const flowManager = getFlowManager();

		const { result } = await flowManager.runWebhookFlow(
			`${method}-${flowId}`,
			{
				path: `/trigger/${flowId}`,
				query: query,
				body: data,
				method: method,
				headers: headers,
			},
			{ accountability, schema },
		);

		return { type: 'text', data: result };
	},
});
