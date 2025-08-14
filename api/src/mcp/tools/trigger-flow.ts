import { z } from 'zod';
import { getFlowManager } from '../../flows.js';
import { defineTool } from '../define.js';
import { QueryInputSchema } from '../schema.js';
import prompts from './prompts/index.js';

const TriggerFlowInputSchema = z.strictObject({
	flowDefinition: z.record(z.string(), z.any()).describe('The full flow definition from the read-flows call.'),
	flowId: z.string().describe('The ID of the flow to trigger'),
	method: z.enum(['GET', 'POST']).default('GET').describe(''),
	query: QueryInputSchema.optional().describe(''),
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
