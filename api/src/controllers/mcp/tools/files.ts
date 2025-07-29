import type { File } from '@directus/types';
import { z } from 'zod';
import type { TransformationSet } from '../../../types/assets.js';
import { PrimaryKeySchema, QuerySchema } from '../schema.js';
import { defineTool } from '../tool.js';
import { items } from './items.js';

const FolderItemSchema = z.object({
	name: z.string(),
	parent: z.string().optional(),
});

const FolderValidateSchema = z.union([
	z.object({
		type: z.literal('folder'),
		action: z.literal('create'),
		data: z.union([z.array(FolderItemSchema), FolderItemSchema]),
		query: QuerySchema.optional(),
	}),
	z.object({
		type: z.literal('folder'),
		action: z.literal('read'),
		keys: z.array(PrimaryKeySchema).optional(),
		query: QuerySchema.optional(),
	}),
	z.object({
		type: z.literal('folder'),
		action: z.literal('update'),
		data: FolderItemSchema,
		keys: z.array(PrimaryKeySchema).optional(),
		query: QuerySchema.optional(),
	}),
	z.object({
		type: z.literal('folder'),
		action: z.literal('delete'),
		keys: z.array(PrimaryKeySchema),
	}),
]);

const AssetValidateSchema = z.object({
	type: z.literal('asset'),
	action: z.literal('read'),
	id: z.string(),
	key: z.string().optional(),
	transforms: z.custom<TransformationSet>().optional(),
	download: z.boolean().optional(),
});

const FileSchema = z.custom<File>();

const FileValidateSchema = z.union([
	z.object({
		type: z.literal('file'),
		action: z.literal('create'),
		data: z.union([z.array(FileSchema), FileSchema]),
		query: QuerySchema.optional(),
	}),
	z.object({
		type: z.literal('file'),
		action: z.literal('read'),
		keys: z.array(PrimaryKeySchema).optional(),
		query: QuerySchema.optional(),
	}),
	z.object({
		type: z.literal('file'),
		action: z.literal('update'),
		data: FileSchema,
		keys: z.array(PrimaryKeySchema).optional(),
		query: QuerySchema.optional(),
	}),
	z.object({
		type: z.literal('file'),
		action: z.literal('delete'),
		keys: z.array(PrimaryKeySchema),
	}),
]);

const ValidateSchema = z.union([FolderValidateSchema, AssetValidateSchema, FileValidateSchema]);

const InputSchema = z.object({
	type: z.enum(['folder', 'file', 'asset']),
	action: z.enum(['read', 'create', 'update', 'delete']).describe('The operation to perform'),
	query: QuerySchema.optional().describe(''),
	keys: z.array(PrimaryKeySchema).optional().describe(''),
	data: z
		.union([z.array(FolderItemSchema), FolderItemSchema])
		.optional()
		.describe(''),
	id: z.string().optional().describe(''),
	key: z.string().optional().describe(''),
	transforms: z.custom<TransformationSet>().optional().describe(''),
	download: z.boolean().optional().describe(''),
});

export const files = defineTool<z.infer<typeof ValidateSchema>>({
	name: 'files',
	description: '',
	inputSchema: InputSchema,
	validateSchema: ValidateSchema,
	async handler({ args, schema, accountability }) {
		if (args.type === 'folder' || args.type === 'file') {
			return items.handler({
				args: {
					collection: args.type === 'folder' ? 'directus_folders' : 'directus_files',
					...args,
				},
				schema,
				accountability,
			});
		}

		if (args.type === 'asset' && args.action === 'read') {
			// assets stream
		}

		return;
	},
});
