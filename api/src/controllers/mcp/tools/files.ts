import type { File, PrimaryKey } from '@directus/types';
import { toArray } from '@directus/utils';
import { z } from 'zod';
import { AssetsService } from '../../../services/assets.js';
import { ItemsService } from '../../../services/items.js';
import { sanitizeQuery } from '../../../utils/sanitize-query.js';
import { PrimaryKeySchema, QuerySchema } from '../schema.js';
import { defineTool } from '../tool.js';

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
		.union([z.array(FolderItemSchema), FolderItemSchema, z.array(FileSchema), FileSchema])
		.optional()
		.describe(''),
	id: z.string().optional().describe(''),
});

export const files = defineTool<z.infer<typeof ValidateSchema>>({
	name: 'files',
	description: '',
	inputSchema: InputSchema,
	validateSchema: ValidateSchema,
	async handler({ args, schema, accountability }) {
		if (args.type === 'folder' || args.type === 'file') {
			const collection = args.type === 'folder' ? 'directus_folders' : 'directus_files';

			let sanitizedQuery = {};

			if ('query' in args && args.query) {
				sanitizedQuery = await sanitizeQuery(
					{
						fields: args.query['fields'] || '*',
						...args.query,
					},
					schema,
					accountability || null,
				);
			}

			const service = new ItemsService(collection, {
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
				await service.deleteMany(args.keys);
			}
		}

		if (args.type === 'asset' && args.action === 'read') {
			const assetsService = new AssetsService({
				accountability,
				schema,
			});

			const asset = await assetsService.getAsset(args.id);

			const chunks = [];

			for await (const chunk of asset.stream) {
				chunks.push(Buffer.from(chunk));
			}

			return {
				type: 'image',
				data: Buffer.concat(chunks).toString('base64'),
				mimeType: 'image/png',
			};
		}
	},
});
