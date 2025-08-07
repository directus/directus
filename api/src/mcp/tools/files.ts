import type { PrimaryKey } from '@directus/types';
import { toArray } from '@directus/utils';
import { z } from 'zod';
import { AssetsService } from '../../services/assets.js';
import { FilesService } from '../../services/files.js';
import { FoldersService } from '../../services/folders.js';
import type { ItemsService } from '../../services/index.js';
import { PrimaryKeyInputSchema, PrimaryKeyValidateSchema, QueryInputSchema, QueryValidateSchema } from '../schema.js';
import { defineTool } from '../tool.js';
import prompts from './prompts/index.js';

const FolderItemSchema = z.strictObject({
	id: PrimaryKeyInputSchema.optional(),
	name: z.string(),
	parent: z.string().optional(),
});

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

const AssetValidateSchema = z.strictObject({
	type: z.literal('asset'),
	action: z.literal('read'),
	id: z.string(),
});

const FileSchema = z.strictObject({
	id: z.string(),
	storage: z.string(),
	filename_disk: z.string(),
	filename_download: z.string(),
	title: z.union([z.string(), z.null()]),
	type: z.union([z.string(), z.null()]),
	folder: z.union([z.string(), z.null()]),
	created_on: z.string(),
	uploaded_by: z.union([z.string(), z.null()]),
	uploaded_on: z.union([z.string(), z.null()]),
	modified_by: z.union([z.string(), z.null()]),
	modified_on: z.string(),
	charset: z.union([z.string(), z.null()]),
	filesize: z.number(),
	width: z.union([z.number(), z.null()]),
	height: z.union([z.number(), z.null()]),
	duration: z.union([z.number(), z.null()]),
	embed: z.union([z.string(), z.null()]),
	description: z.union([z.string(), z.null()]),
	location: z.union([z.string(), z.null()]),
	tags: z.union([z.string(), z.null()]),
	metadata: z.union([z.record(z.string(), z.any()), z.null()]),
	focal_point_x: z.union([z.number(), z.null()]),
	focal_point_y: z.union([z.number(), z.null()]),
	tus_id: z.union([z.string(), z.null()]),
	tus_data: z.union([z.record(z.string(), z.any()), z.null()]),
});

const FileValidateSchema = z.union([
	z.strictObject({
		type: z.literal('file'),
		action: z.literal('create'),
		data: z.union([z.array(FileSchema), FileSchema]),
		query: QueryValidateSchema.optional(),
	}),
	z.strictObject({
		type: z.literal('file'),
		action: z.literal('read'),
		keys: z.array(PrimaryKeyValidateSchema).optional(),
		query: QueryValidateSchema.optional(),
	}),
	z.strictObject({
		type: z.literal('file'),
		action: z.literal('update'),
		data: FileSchema,
		keys: z.array(PrimaryKeyValidateSchema).optional(),
		query: QueryValidateSchema.optional(),
	}),
	z.strictObject({
		type: z.literal('file'),
		action: z.literal('delete'),
		keys: z.array(PrimaryKeyValidateSchema),
	}),
]);

const ValidateSchema = z.union([FolderValidateSchema, AssetValidateSchema, FileValidateSchema]);

const InputSchema = z.strictObject({
	type: z.enum(['folder', 'file', 'asset']),
	action: z.enum(['read', 'create', 'update', 'delete']).describe('The operation to perform'),
	query: QueryInputSchema.optional().describe(''),
	keys: z.array(PrimaryKeyInputSchema).optional().describe(''),
	data: z
		.union([z.array(FolderItemSchema), FolderItemSchema, z.array(FileSchema), FileSchema])
		.optional()
		.describe(''),
	id: z.string().optional().describe(''),
});

export const files = defineTool<z.infer<typeof ValidateSchema>>({
	name: 'files',
	description: prompts.files,
	inputSchema: InputSchema,
	validateSchema: ValidateSchema,
	async handler({ args, schema, accountability, sanitizedQuery }) {
		if (args.type === 'folder' || args.type === 'file') {
			let service: ItemsService;

			const serviceOptions = {
				schema,
				accountability,
			};

			if (args.type === 'folder') {
				service = new FoldersService(serviceOptions);
			} else {
				service = new FilesService(serviceOptions);
			}

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

		throw new Error('Invalid type.');
	},
});
