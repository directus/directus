import type { PrimaryKey } from '@directus/types';
import { toArray } from '@directus/utils';
import { z } from 'zod';
import { FoldersService } from '../../services/folders.js';
import { defineTool } from '../define.js';
import {
	FolderItemInputSchema,
	FolderItemValidateSchema,
	PrimaryKeyInputSchema,
	PrimaryKeyValidateSchema,
	QueryInputSchema,
	QueryValidateSchema,
} from '../schema.js';
import prompts from './prompts/index.js';

const FoldersValidateSchema = z.discriminatedUnion('action', [
	z.strictObject({
		action: z.literal('create'),
		data: z.union([z.array(FolderItemValidateSchema), FolderItemValidateSchema]),
		query: QueryValidateSchema.optional(),
	}),
	z.strictObject({
		action: z.literal('read'),
		keys: z.array(PrimaryKeyValidateSchema).optional(),
		query: QueryValidateSchema.optional(),
	}),
	z.strictObject({
		action: z.literal('update'),
		data: FolderItemValidateSchema,
		keys: z.array(PrimaryKeyValidateSchema).optional(),
		query: QueryValidateSchema.optional(),
	}),
	z.strictObject({
		action: z.literal('delete'),
		keys: z.array(PrimaryKeyValidateSchema),
	}),
]);

const FoldersInputSchema = z.object({
	action: z.enum(['create', 'read', 'update', 'delete']).describe('The operation to perform'),
	query: QueryInputSchema.optional(),
	keys: z.array(PrimaryKeyInputSchema).optional(),
	data: z.array(FolderItemInputSchema).optional(),
});

export const folders = defineTool<z.infer<typeof FoldersValidateSchema>>({
	name: 'folders',
	description: prompts.folders,
	annotations: {
		title: 'Directus - Folders',
	},
	inputSchema: FoldersInputSchema,
	validateSchema: FoldersValidateSchema,
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
				data: result || null,
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
