import type { FlowRaw, OperationRaw } from '@directus/types';
import { z } from 'zod';
import { getFlowManager } from '../../flows.js';
import { FlowsService } from '../../services/flows.js';
import { OperationsService } from '../../services/operations.js';
import { QuerySchema } from '../schema.js';
import { defineTool } from '../tool.js';

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
	description: `Perform CRUD operations on Directus Flows.

### ⚠️ CRITICAL: Data Parameter Format
The 'data' parameter MUST be passed as a native JavaScript object or array, NOT as a stringified JSON string.
Passing stringified JSON will cause validation errors.

**Correct:** \`"data": {"name": "My Flow", "trigger": "manual"}\`
**Incorrect:** \`"data": "{\\"name\\": \\"My Flow\\", \\"trigger\\": \\"manual\\"}"\`

### 🔄 Flow Properties
- **name** (string) - The name of the flow
- **icon** (string, optional) - Icon displayed in the Admin App
- **color** (string, optional) - Color of the icon in the Admin App
- **description** (string, optional) - Description of the flow
- **status** (string) - Current status: 'active' or 'inactive' (defaults to 'active')
- **trigger** (string) - Type of trigger: 'event', 'webhook', 'operation', 'schedule', or 'manual'
- **accountability** (string, optional) - Permission scope: '$public', '$trigger', '$full', or UUID of a role
- **options** (object, optional) - Options for the selected trigger
- **operation** (string, optional) - UUID of the operation connected to the trigger

### 📝 Usage Examples
**Create Flow:**
\`\`\`json
{
  "name": "Article Notification Flow",
  "trigger": "event",
  "status": "active",
  "description": "Sends notifications when articles are published",
  "icon": "notifications",
  "color": "#4CAF50",
  "accountability": "$trigger"
}
\`\`\`

**Update Flow:**
\`\`\`json
{
  "status": "inactive",
  "description": "Updated description"
}
\`\`\`

### ⚠️ Important Notes
- For create operations, only 'name' and 'trigger' are required; other properties are optional
- For update operations, provide only the fields you want to change
- Always pass data in its native format to avoid validation errors
- Use 'key' parameter for single item operations (read, update, delete)
- Supports all standard Directus query parameters (fields, filter, sort, limit, offset)`,
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
	description: 'Perform CRUD operations on Directus Flow Operations',
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
	description: `Trigger a flow by ID. Rules:
	  - Always call read-flows first and include the FULL flow definition in your reasoning
	  - Always explicitly check if the flow requires selection (options.requireSelection !== false)
	  - Always verify the collection is in the flow's collections list
	  - Always provide a complete data object with all required fields
	  - NEVER skip providing keys when requireSelection is true or undefined`,
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
