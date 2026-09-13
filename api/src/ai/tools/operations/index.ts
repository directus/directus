import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { InvalidPayloadError } from '@directus/errors';
import type { OperationRaw } from '@directus/types';
import { z } from 'zod';
import { ItemsService } from '../../../services/items.js';
import { OperationsService } from '../../../services/operations.js';
import { requireText } from '../../../utils/require-text.js';
import { defineTool } from '../define-tool.js';
import {
	OperationItemInputSchema,
	OperationItemValidateSchema,
	QueryInputSchema,
	QueryValidateSchema,
} from '../schema.js';
import { buildSanitizedQueryFromArgs } from '../utils.js';
import { relayoutFlow } from './position.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const OperationsValidationSchema = z.discriminatedUnion('action', [
	z.strictObject({
		action: z.literal('create'),
		// A lone coordinate has nothing to merge with on create, unlike update
		data: OperationItemValidateSchema.refine(
			(data) => (data.position_x == null) === (data.position_y == null),
			'Provide both `position_x` and `position_y`, or omit both for automatic layout',
		),
	}),
	z.strictObject({
		action: z.literal('read'),
		query: QueryValidateSchema.optional(),
	}),
	z.strictObject({
		action: z.literal('update'),
		data: OperationItemValidateSchema,
		key: z.string(),
		query: QueryValidateSchema.optional(),
	}),
	z.strictObject({
		action: z.literal('delete'),
		key: z.string(),
	}),
]);

export const OperationsInputSchema = z.object({
	action: z.enum(['create', 'read', 'update', 'delete']).describe('The operation to perform'),
	query: QueryInputSchema.optional(),
	data: OperationItemInputSchema.optional(),
	key: z.string().optional(),
});

export const operations = defineTool<z.infer<typeof OperationsValidationSchema>>({
	name: 'operations',
	admin: true,
	description:
		'Reads and changes Directus flow operations. Use to build or inspect operation chains inside automation flows.',
	instructions: requireText(resolve(__dirname, './prompt.md')),
	keywords: ['flow steps', 'automation steps', 'data chain', 'resolve', 'reject', 'operation key'],
	annotations: {
		title: 'Directus - Operations',
		destructiveHint: true,
	},
	inputSchema: OperationsInputSchema,
	validateSchema: OperationsValidationSchema,
	readOnly: (input) => input.action === 'read',
	async handler({ args, schema, accountability }) {
		const operationService = new OperationsService({
			schema,
			accountability,
		});

		// Position writes don't affect flow execution, so run them through a plain
		// ItemsService to skip OperationsService's per-row flow engine reload
		const layoutService = new ItemsService<OperationRaw>('directus_operations', { schema, accountability });
		const flowsService = new ItemsService('directus_flows', { schema, accountability });

		if (args.action === 'create') {
			const explicitPosition = args.data.position_x != null && args.data.position_y != null;

			if (!explicitPosition) {
				// Placeholder for the NOT NULL columns; relayoutFlow assigns the real spot
				args.data = { ...args.data, position_x: 19, position_y: 1 };
			}

			const savedKey = await operationService.createOne(args.data);

			if (!explicitPosition && args.data.flow) {
				await relayoutFlow(layoutService, flowsService, args.data.flow);
			}

			const result = await operationService.readOne(savedKey);

			return {
				type: 'text',
				data: result || null,
			};
		}

		if (args.action === 'read') {
			const sanitizedQuery = await buildSanitizedQueryFromArgs(args, schema, accountability);
			const result = await operationService.readByQuery(sanitizedQuery);

			return {
				type: 'text',
				data: result || null,
			};
		}

		if (args.action === 'update') {
			const sanitizedQuery = await buildSanitizedQueryFromArgs(args, schema, accountability);

			let sourceFlow: string | undefined;

			if (args.data.flow != null) {
				const existing = await operationService.readOne(args.key, { fields: ['id', 'flow', 'resolve', 'reject'] });
				sourceFlow = existing['flow'] as string;

				if (args.data.flow !== existing['flow']) {
					// A dangling resolve/reject reference aborts flow loading for the
					// whole engine (constructFlowTree), so cross-flow moves must be
					// fully unlinked in both directions
					const resolve = args.data.resolve !== undefined ? args.data.resolve : existing['resolve'];
					const reject = args.data.reject !== undefined ? args.data.reject : existing['reject'];

					const [referencedBy, entryPointOf] = await Promise.all([
						operationService.readByQuery({
							filter: { _or: [{ resolve: { _eq: args.key } }, { reject: { _eq: args.key } }] },
							fields: ['id'],
							limit: 1,
						}),
						flowsService.readByQuery({
							filter: { operation: { _eq: args.key } },
							fields: ['id'],
							limit: 1,
						}),
					]);

					if (resolve || reject || referencedBy.length > 0 || entryPointOf.length > 0) {
						throw new InvalidPayloadError({
							reason:
								'Cannot move a linked operation to another flow. Clear its resolve/reject and any references to it first',
						});
					}
				}
			}

			const updatedKey = await operationService.updateOne(args.key, args.data as OperationRaw);

			const linksChanged = args.data.resolve !== undefined || args.data.reject !== undefined;
			const flowChanged = args.data.flow != null && args.data.flow !== sourceFlow;
			const explicitPosition = args.data.position_x != null || args.data.position_y != null;

			if (!explicitPosition && (linksChanged || flowChanged)) {
				const flow =
					args.data.flow ?? ((await operationService.readOne(args.key, { fields: ['flow'] }))['flow'] as string);

				if (flow) await relayoutFlow(layoutService, flowsService, flow);
				if (flowChanged && sourceFlow) await relayoutFlow(layoutService, flowsService, sourceFlow);
			}

			const result = await operationService.readOne(updatedKey, sanitizedQuery);

			return {
				type: 'text',
				data: result || null,
			};
		}

		if (args.action === 'delete') {
			const existing = await operationService.readOne(args.key, { fields: ['flow'] });
			const deletedKey = await operationService.deleteOne(args.key);

			if (existing['flow']) {
				await relayoutFlow(layoutService, flowsService, existing['flow'] as string);
			}

			return {
				type: 'text',
				data: deletedKey,
			};
		}

		throw new Error('Invalid action.');
	},
});
