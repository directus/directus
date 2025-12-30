import { FlowsService } from '../../../services/flows.js';
import { requireText } from '../../../utils/require-text.js';
import { defineTool } from '../define-tool.js';
import { FlowItemInputSchema, FlowItemValidateSchema, QueryInputSchema, QueryValidateSchema } from '../schema.js';
import { buildSanitizedQueryFromArgs } from '../utils.js';
import type { FlowRaw } from '@directus/types';
import { isObject } from '@directus/utils';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

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
	description: requireText(resolve(__dirname, './prompt.md')),
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
	async handler({ args, schema, accountability }) {
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
			const sanitizedQuery = await buildSanitizedQueryFromArgs(args, schema, accountability);
			const result = await flowsService.readByQuery(sanitizedQuery);

			return {
				type: 'text',
				data: result || null,
			};
		}

		if (args.action === 'update') {
			const sanitizedQuery = await buildSanitizedQueryFromArgs(args, schema, accountability);
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
