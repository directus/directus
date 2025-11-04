import { OperationsService } from '@/services/operations.js';
import { requireText } from '@/utils/require-text.js';
import type { OperationRaw } from '@directus/types';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { defineTool } from '../define-tool.js';
import {
	OperationItemInputSchema,
	OperationItemValidateSchema,
	QueryInputSchema,
	QueryValidateSchema,
} from '../schema.js';
import { sanitizeQuery } from '@/utils/sanitize-query.js';
import type { Query } from 'express-serve-static-core';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
	data: OperationItemInputSchema.optional(),
	key: z.string().optional(),
});

export const operations = defineTool<z.infer<typeof OperationsValidationSchema>>({
	name: 'operations',
	admin: true,
	description: requireText(resolve(__dirname, './prompt.md')),
	annotations: {
		title: 'Directus - Operations',
	},
	inputSchema: OperationsInputSchema,
	validateSchema: OperationsValidationSchema,
	async handler({ args, schema, accountability }) {
		let sanitizedQuery = {};

		if ('query' in args && args['query']) {
			sanitizedQuery = await sanitizeQuery(
				{
					fields: (args['query'] as Query)['fields'] || '*',
					...args['query'],
				},
				schema,
				accountability,
			);
		}

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
