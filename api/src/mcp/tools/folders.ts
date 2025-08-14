import type { PrimaryKey } from '@directus/types';
import { toArray } from '@directus/utils';
import { z } from 'zod';
import { FoldersService } from '../../services/folders.js';
import { defineTool } from '../define.js';
import {
	FolderItemSchema,
	PrimaryKeyInputSchema,
	PrimaryKeyValidateSchema,
	QueryInputSchema,
	QueryValidateSchema,
} from '../schema.js';
import prompts from './prompts/index.js';

const FolderValidateSchema = z.union([
	z.strictObject({
		type: z.literal('folder'),
		action: z.literal('create'),
		data: z.union([z.array(FolderItemSchema), FolderItemSchema]),
		query: QueryValidateSchema.optional(),
	}),
	z.strictObject({
		type: z.literal('folder'),
		action: z.literal('read'),
		keys: z.array(PrimaryKeyValidateSchema).optional(),
		query: QueryValidateSchema.optional(),
	}),
	z.strictObject({
		type: z.literal('folder'),
		action: z.literal('update'),
		data: FolderItemSchema,
		keys: z.array(PrimaryKeyValidateSchema).optional(),
		query: QueryValidateSchema.optional(),
	}),
	z.strictObject({
		type: z.literal('folder'),
		action: z.literal('delete'),
		keys: z.array(PrimaryKeyValidateSchema),
	}),
]);

const FolderInputSchema = z.strictObject({
	type: z.enum(['folder', 'file', 'asset']),
	action: z.enum(['read', 'create', 'update', 'delete']).describe('The operation to perform'),
	query: QueryInputSchema.optional().describe(''),
	keys: z.array(PrimaryKeyInputSchema).optional().describe(''),
	data: z
		.union([z.array(FolderItemSchema), FolderItemSchema])
		.optional()
		.describe(''),
});

export const folders = defineTool<z.infer<typeof FolderValidateSchema>>({
	name: 'folders',
	description: prompts.folders,
	inputSchema: FolderInputSchema,
	validateSchema: FolderValidateSchema,
	async handler({ args, schema, accountability, sanitizedQuery }) {
		const service = new FoldersService({
			schema,
			accountability,
		});

		if (args.action === 'create') {
			const data = toArray(args.data);

			const savedKeys = await service.createMany(data);

			const result = await service.readMany(savedKeys, sanitizedQuery);

			return {
				type: 'text',
				data: result || null,
			};
		}

		if (args.action === 'read') {
			let result = null;

			if (args.keys) {
				result = await service.readMany(args.keys, sanitizedQuery);
			} else {
				result = await service.readByQuery(sanitizedQuery);
			}

			return {
				type: 'text',
				data: result,
			};
		}

		if (args.action === 'update') {
			let updatedKeys: PrimaryKey[] = [];

			if (Array.isArray(args.data)) {
				updatedKeys = await service.updateBatch(args.data);
			} else if (args.keys) {
				updatedKeys = await service.updateMany(args.keys, args.data);
			} else {
				updatedKeys = await service.updateByQuery(sanitizedQuery, args.data);
			}

			const result = await service.readMany(updatedKeys, sanitizedQuery);

			return {
				type: 'text',
				data: result,
			};
		}

		if (args.action === 'delete') {
			const deletedKeys = await service.deleteMany(args.keys);

			return {
				type: 'text',
				data: deletedKeys,
			};
		}

		throw new Error('Invalid action.');
	},
});
