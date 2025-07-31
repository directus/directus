import type { File, PrimaryKey } from '@directus/types';
import { toArray } from '@directus/utils';
import { z } from 'zod';
import { AssetsService } from '../../services/assets.js';
import { FilesService } from '../../services/files.js';
import { FoldersService } from '../../services/folders.js';
import { PrimaryKeySchema, QuerySchema } from '../schema.js';
import { defineTool } from '../tool.js';
import type { ItemsService } from '../../services/index.js';

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
	description:
		'Perform CRUD operations on files and folders, or fetch and return a base64-encoded Directus asset.\n\n### 🗂️ Available Types\n• `folder` – Operate on system folders\n• `file` – Operate on stored files and file metadata\n• `asset` – Retrieve a binary asset stream as base64-encoded image (read-only)\n\n### ⚙️ Available Actions\n• `create` – Add one or more folders/files (only for type `folder` or `file`)\n• `read` – Fetch one or more folders, files, or a specific asset by ID\n• `update` – Modify existing folder or file metadata\n• `delete` – Remove folders or files by keys\n\n### 🧭 Behavior\n#### `folder` / `file` Types\n- Uses corresponding service (`FoldersService` or `FilesService`)\n- CRUD operations supported\n- Accepts `data`, `keys`, and query options (`fields`, `filter`, etc.)\n\n#### `asset` Type\n- Only supports `read`\n- Requires an `id` parameter (file ID)\n- Returns a base64-encoded image stream with `mimeType`\n\n### 📘 Usage Notes\n- For `create` and `update`, `data` can be a single object or an array\n- `read` supports both key-based and query-based lookups\n- `delete` always uses the `keys` parameter\n- `asset` reads return a single file stream encoded in base64 (PNG output expected)\n\n### ⚠️ Limitations\n- `asset` streaming is read-only\n- `asset` only returns image content\n- Other binary formats (PDF, video, etc.) are not supported in this mode',
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
		
		throw new Error('Invalid type.');
	},
});
