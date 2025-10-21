import type { File, PrimaryKey } from '@directus/types';
import { isObject } from '@directus/utils';
import { z } from 'zod';
import { FilesService } from '../../services/files.js';
import { defineTool } from '../define.js';
import {
	FileImportItemInputSchema,
	FileImportItemValidateSchema,
	FileItemInputSchema,
	FileItemValidateSchema,
	PrimaryKeyInputSchema,
	PrimaryKeyValidateSchema,
	QueryInputSchema,
	QueryValidateSchema,
} from '../schema.js';
import prompts from './prompts/index.js';

export const FilesValidateSchema = z.discriminatedUnion('action', [
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
	z.strictObject({
		action: z.literal('import'),
		data: z.array(FileImportItemValidateSchema),
	}),
]);

const FilesInputSchema = z.object({
	action: z.enum(['read', 'update', 'delete', 'import']).describe('The operation to perform'),
	query: QueryInputSchema.optional(),
	keys: z.array(PrimaryKeyInputSchema).optional(),
	data: z.array(FileItemInputSchema.extend({ ...FileImportItemInputSchema.shape }).partial()).optional(),
});

export const files = defineTool<z.infer<typeof FilesValidateSchema>>({
	name: 'files',
	description: prompts.files,
	annotations: {
		title: 'Directus - Files',
	},
	inputSchema: FilesInputSchema,
	validateSchema: FilesValidateSchema,
	endpoint({ data }) {
		if (!isObject(data) || !('id' in data)) {
			return;
		}

		return ['files', data['id'] as string];
	},
	async handler({ args, schema, accountability, sanitizedQuery }) {
		const service = new FilesService({
			schema,
			accountability,
		});

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
				updatedKeys = await service.updateMany(args.keys, args.data as Partial<File>);
			} else {
				updatedKeys = await service.updateByQuery(sanitizedQuery, args.data as Partial<File>);
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

		if (args.action === 'import') {
			const savedKeys = [];

			for (const file of args.data) {
				const savedKey = await service.importOne(file.url, file.file as Partial<File>);

				savedKeys.push(savedKey);
			}

			return {
				type: 'text',
				data: savedKeys,
			};
		}

		throw new Error('Invalid action.');
	},
});
