import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { InvalidPayloadError } from '@directus/errors';
import type { Collection, RawCollection } from '@directus/types';
import { isObject, toArray } from '@directus/utils';
import { z } from 'zod';
import { CollectionsService } from '../../../services/collections.js';
import { requireText } from '../../../utils/require-text.js';
import { defineTool } from '../define-tool.js';
import {
	CollectionItemInputSchema,
	CollectionItemValidateCreateSchema,
	CollectionItemValidateUpdateSchema,
} from '../schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const CollectionsValidateSchema = z.discriminatedUnion('action', [
	z.strictObject({
		action: z.literal('create'),
		data: z.array(CollectionItemValidateCreateSchema),
	}),
	z.strictObject({
		action: z.literal('read'),
		keys: z.array(z.string()).optional(),
	}),
	z.strictObject({
		action: z.literal('update'),
		data: z.array(CollectionItemValidateUpdateSchema),
	}),
	z.strictObject({
		action: z.literal('delete'),
		keys: z.array(z.string()),
	}),
]);

export const CollectionsInputSchema = z.object({
	action: z.enum(['create', 'read', 'update', 'delete']).describe('The operation to perform'),
	keys: z.array(z.string()).optional(),
	data: z.array(CollectionItemInputSchema).optional(),
});

export const collections = defineTool<z.infer<typeof CollectionsValidateSchema>>({
	name: 'collections',
	admin: true,
	description: requireText(resolve(__dirname, './prompt.md')),
	annotations: {
		title: 'Directus - Collections',
	},
	inputSchema: CollectionsInputSchema,
	validateSchema: CollectionsValidateSchema,
	endpoint({ data }) {
		if (!isObject(data) || !('collection' in data)) {
			return;
		}

		return ['content', data['collection'] as string];
	},
	async handler({ args, schema, accountability }) {
		const service = new CollectionsService({
			schema,
			accountability,
		});

		if (args.action === 'create') {
			const data = toArray(args.data);

			const savedKeys = await service.createMany(data as RawCollection[]);

			const result = await service.readMany(savedKeys);

			return {
				type: 'text',
				data: result || null,
			};
		}

		if (args.action === 'read') {
			let result = null;

			if (args.keys) {
				result = await service.readMany(args.keys);
			} else {
				result = await service.readByQuery();
			}

			return {
				type: 'text',
				data: result || null,
			};
		}

		if (args.action === 'update') {
			const updatedKeys = await service.updateBatch(toArray(args.data as Collection | Collection[]));

			const result = await service.readMany(updatedKeys);

			return {
				type: 'text',
				data: result || null,
			};
		}

		if (args.action === 'delete') {
			const deletedKeys = await service.deleteMany(args.keys);

			return {
				type: 'text',
				data: deletedKeys,
			};
		}

		throw new InvalidPayloadError({ reason: 'Invalid action' });
	},
});
