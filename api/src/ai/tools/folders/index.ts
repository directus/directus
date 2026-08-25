import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { InvalidPayloadError } from '@directus/errors';
import type { Folder, PrimaryKey } from '@directus/types';
import { toArray } from '@directus/utils';
import { z } from 'zod';
import { FoldersService } from '../../../services/folders.js';
import { requireText } from '../../../utils/require-text.js';
import { defineTool } from '../define-tool.js';
import {
	FolderItemInputSchema,
	FolderItemOutputSchema,
	FolderItemValidateSchema,
	PrimaryKeyInputSchema,
	PrimaryKeyOutputSchema,
	PrimaryKeyValidateSchema,
	QueryInputSchema,
	QueryValidateSchema,
} from '../schema.js';
import { buildSanitizedQueryFromArgs } from '../utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

const FoldersOutputSchema = z.object({
	data: z.union([z.array(FolderItemOutputSchema), z.array(PrimaryKeyOutputSchema), z.null()]),
});

export const folders = defineTool<z.infer<typeof FoldersValidateSchema>, z.infer<typeof FoldersOutputSchema>>({
	name: 'folders',
	description:
		'Reads and changes Directus file folders. Use to organize files into folder hierarchies or inspect existing folder records.',
	instructions: requireText(resolve(__dirname, './prompt.md')),
	keywords: ['directories', 'media folders', 'file organization', 'parent folder'],
	annotations: {
		title: 'Directus - Folders',
		destructiveHint: true,
	},
	inputSchema: FoldersInputSchema,
	validateSchema: FoldersValidateSchema,
	output: FoldersOutputSchema,
	readOnly: (input) => input.action === 'read',
	async handler({ args, schema, accountability }) {
		const service = new FoldersService({
			schema,
			accountability,
		});

		const assetFilter = { type: { _eq: 'assets' } };

		const assertAssetFolders = async (keys: PrimaryKey[]) => {
			const uniqueKeys = [...new Set(keys)];

			const existing = (await service.readByQuery({
				filter: { _and: [{ id: { _in: uniqueKeys } }, assetFilter] },
				limit: -1,
				fields: ['id'],
			})) as { id: PrimaryKey }[];

			if (existing.length !== uniqueKeys.length) {
				throw new InvalidPayloadError({ reason: 'This tool can only modify file-library folders' });
			}
		};

		if (args.action === 'create') {
			const sanitizedQuery = await buildSanitizedQueryFromArgs(args, schema, accountability);

			// This tool manages file-library folders only; force the asset type.
			const data = toArray(args.data).map((item) => ({ ...item, type: 'assets' }));

			const savedKeys = await service.createMany(data as Partial<Folder>[]);

			const result = await service.readMany(savedKeys, sanitizedQuery);

			return {
				type: 'text',
				data: result || null,
			};
		}

		if (args.action === 'read') {
			const sanitizedQuery = await buildSanitizedQueryFromArgs(args, schema, accountability);

			// This tool manages file-library folders only; scope reads to the asset type.
			sanitizedQuery.filter = sanitizedQuery.filter ? { _and: [sanitizedQuery.filter, assetFilter] } : assetFilter;

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
			const sanitizedQuery = await buildSanitizedQueryFromArgs(args, schema, accountability);

			const data = Array.isArray(args.data)
				? args.data.map((item) => ({ ...item, type: 'assets' }))
				: { ...args.data, type: 'assets' };

			let updatedKeys: PrimaryKey[] = [];

			if (Array.isArray(data)) {
				await assertAssetFolders(data.map((item) => item.id).filter((id): id is PrimaryKey => id != null));
				updatedKeys = await service.updateBatch(data as Partial<Folder>[]);
			} else if (args.keys) {
				await assertAssetFolders(args.keys);
				updatedKeys = await service.updateMany(args.keys, data as Partial<Folder>);
			} else {
				sanitizedQuery.filter = sanitizedQuery.filter ? { _and: [sanitizedQuery.filter, assetFilter] } : assetFilter;
				updatedKeys = await service.updateByQuery(sanitizedQuery, data as Partial<Folder>);
			}

			const result = await service.readMany(updatedKeys, sanitizedQuery);

			return {
				type: 'text',
				data: result,
			};
		}

		if (args.action === 'delete') {
			await assertAssetFolders(args.keys);

			const deletedKeys = await service.deleteMany(args.keys);

			return {
				type: 'text',
				data: deletedKeys,
			};
		}

		throw new Error('Invalid action.');
	},
});
