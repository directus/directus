import type { PrimaryKey } from '@directus/types';
import { toArray } from '@directus/utils';
import { z } from 'zod';
import { FilesService } from '../../services/files.js';
import { defineTool } from '../define.js';
import {
	FileItemInputSchema,
	FileItemValidateSchema,
	PrimaryKeyInputSchema,
	PrimaryKeyValidateSchema,
	QueryInputSchema,
	QueryValidateSchema,
} from '../schema.js';
import prompts from './prompts/index.js';

export const FilesValidateSchema = z.union([
	z.strictObject({
		action: z.literal('create'),
		data: z.union([z.array(FileItemValidateSchema), FileItemValidateSchema]),
		query: QueryValidateSchema.optional(),
	}),
	z.strictObject({
		action: z.literal('read'),
		keys: z.array(PrimaryKeyValidateSchema).optional(),
		query: QueryValidateSchema.optional(),
	}),
	z.strictObject({
		action: z.literal('update'),
		data: FileItemValidateSchema,
		keys: z.array(PrimaryKeyValidateSchema).optional(),
		query: QueryValidateSchema.optional(),
	}),
	z.strictObject({
		action: z.literal('delete'),
		keys: z.array(PrimaryKeyValidateSchema),
	}),
]);

const FilesInputSchema = z.object({
	action: z.enum(['create', 'read', 'update', 'delete']).describe('The operation to perform'),
	query: QueryInputSchema.optional(),
	keys: z.array(PrimaryKeyInputSchema).optional(),
	data: z.union([z.array(FileItemInputSchema), FileItemInputSchema]).optional(),
});

export const files = defineTool<z.infer<typeof FilesValidateSchema>>({
	name: 'files',
	description: prompts.files,
	inputSchema: FilesInputSchema,
	validateSchema: FilesValidateSchema,
	async handler({ args, schema, accountability, sanitizedQuery }) {
		const service = new FilesService({
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
