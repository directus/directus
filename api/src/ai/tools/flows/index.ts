import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FlowRaw, OperationRaw } from '@directus/types';
import { isObject } from '@directus/utils';
import { z } from 'zod';
import { FlowsService } from '../../../services/flows.js';
import { ItemsService } from '../../../services/items.js';
import { requireText } from '../../../utils/require-text.js';
import { defineTool } from '../define-tool.js';
import { relayoutFlow } from '../operations/position.js';
import { FlowItemInputSchema, FlowItemValidateSchema, QueryInputSchema, QueryValidateSchema } from '../schema.js';
import { buildSanitizedQueryFromArgs } from '../utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
	description:
		'Reads and changes Directus automation flows. Use for event, schedule, webhook, operation, or manual flow definitions.',
	instructions: requireText(resolve(__dirname, './prompt.md')),
	keywords: ['automation', 'workflow', 'webhook', 'schedule', 'event hook', 'manual flow'],
	annotations: {
		title: 'Directus - Flows',
		destructiveHint: true,
	},
	inputSchema: FlowsInputSchema,
	validateSchema: FlowsValidateSchema,
	readOnly: (input) => input.action === 'read',
	endpoint({ data }) {
		if (!isObject(data) || !('id' in data)) {
			return;
		}

		return ['settings', 'flows', data['id'] as string];
	},
	async handler({ args, schema, accountability }) {
		const flowsService = new FlowsService({
			schema,
			accountability,
		});

		// Nested operations get placeholder coordinates for the NOT NULL columns;
		// relayoutFlow assigns the real spots after the mutation
		const prepareNestedOperations = (data: Partial<FlowRaw>) => {
			if (!Array.isArray(data.operations)) return false;

			data.operations = data.operations.map(
				(operation) => ({ position_x: 19, position_y: 1, ...(operation as Partial<OperationRaw>) }) as OperationRaw,
			);

			return true;
		};

		const layoutService = new ItemsService<OperationRaw>('directus_operations', { schema, accountability });

		if (args.action === 'create') {
			const hasNestedOperations = prepareNestedOperations(args.data as Partial<FlowRaw>);
			const savedKey = await flowsService.createOne(args.data);

			if (hasNestedOperations) await relayoutFlow(layoutService, flowsService, savedKey as string);

			const result = await flowsService.readOne(savedKey);

			return {
				type: 'text',
				data: result || null,
			};
		}

		if (args.action === 'read') {
			const sanitizedQuery = await buildSanitizedQueryFromArgs(args, schema, accountability);
			const result = await flowsService.readByQuery(sanitizedQuery);

			return {
				type: 'text',
				data: result || null,
			};
		}

		if (args.action === 'update') {
			const sanitizedQuery = await buildSanitizedQueryFromArgs(args, schema, accountability);
			const hasNestedOperations = prepareNestedOperations(args.data as Partial<FlowRaw>);
			const updatedKey = await flowsService.updateOne(args.key, args.data as Partial<FlowRaw>);

			if (hasNestedOperations) await relayoutFlow(layoutService, flowsService, args.key);

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
