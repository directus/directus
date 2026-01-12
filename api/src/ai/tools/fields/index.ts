import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { InvalidPayloadError } from '@directus/errors';
import type { Field, Item, RawField, Type } from '@directus/types';
import { toArray } from '@directus/utils';
import { z } from 'zod';
import { clearSystemCache } from '../../../cache.js';
import getDatabase from '../../../database/index.js';
import { FieldsService } from '../../../services/fields.js';
import { getSchema } from '../../../utils/get-schema.js';
import { requireText } from '../../../utils/require-text.js';
import { shouldClearCache } from '../../../utils/should-clear-cache.js';
import { transaction } from '../../../utils/transaction.js';
import { defineTool } from '../define-tool.js';
import {
	FieldItemInputSchema,
	FieldItemValidateSchema,
	RawFieldItemInputSchema,
	RawFieldItemValidateSchema,
} from '../schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

type FieldCreateItem = Partial<Field> & {
	field: string;
	type: Type | null;
};

export const FieldsBaseValidateSchema = z.strictObject({
	collection: z.string(),
});

export const FieldsValidateSchema = z.discriminatedUnion('action', [
	FieldsBaseValidateSchema.extend({
		action: z.literal('create'),
		data: z.union([z.array(FieldItemValidateSchema), FieldItemValidateSchema]),
	}),
	z.object({
		action: z.literal('read'),
		collection: z.string().optional(),
		field: z.string().optional(),
	}),
	FieldsBaseValidateSchema.extend({
		action: z.literal('update'),
		data: z.array(RawFieldItemValidateSchema),
	}),
	FieldsBaseValidateSchema.extend({
		action: z.literal('delete'),
		field: z.string(),
	}),
]);

export const FieldsInputSchema = z.object({
	action: z.enum(['read', 'create', 'update', 'delete']).describe('The operation to perform'),
	collection: z.string().describe('The name of the collection').optional(),
	field: z.string().optional(),
	data: z
		.array(
			FieldItemInputSchema.extend({
				children: RawFieldItemInputSchema.shape.children,
			}).partial(),
		)
		.optional(),
});

export const fields = defineTool<z.infer<typeof FieldsValidateSchema>>({
	name: 'fields',
	admin: true,
	description: requireText(resolve(__dirname, './prompt.md')),
	annotations: {
		title: 'Directus - Fields',
	},
	inputSchema: FieldsInputSchema,
	validateSchema: FieldsValidateSchema,
	async handler({ args, schema, accountability }) {
		let service = new FieldsService({
			schema,
			accountability,
		});

		if (args.action === 'create') {
			const fields = toArray(args.data as FieldCreateItem | FieldCreateItem[]);

			const knex = getDatabase();

			const result: Item[] = [];

			await transaction(knex, async (trx) => {
				service = new FieldsService({
					schema,
					accountability,
					knex: trx,
				});

				for (const field of fields) {
					await service.createField(args.collection, field, undefined, {
						autoPurgeCache: false,
						autoPurgeSystemCache: false,
					});
				}
			});

			// manually clear cache
			if (shouldClearCache(service.cache)) {
				await service.cache.clear();
			}

			await clearSystemCache();

			service = new FieldsService({
				schema: await getSchema(),
				accountability,
			});

			for (const field of fields) {
				const createdField = await service.readOne(args.collection, field.field);
				result.push(createdField);
			}

			return {
				type: 'text',
				data: result || null,
			};
		}

		if (args.action === 'read') {
			let result = null;

			if (args.collection) {
				if (args.field) {
					result = await service.readOne(args.collection, args.field);
				} else {
					result = await service.readAll(args.collection);
				}
			} else {
				result = await service.readAll();
			}

			return {
				type: 'text',
				data: result || null,
			};
		}

		if (args.action === 'update') {
			const fields = toArray(args.data as RawField | RawField[]);

			const knex = getDatabase();

			const result: Item[] = [];

			await transaction(knex, async (trx) => {
				service = new FieldsService({
					schema,
					accountability,
					knex: trx,
				});

				for (const field of fields) {
					await service.updateField(args.collection, field, {
						autoPurgeCache: false,
						autoPurgeSystemCache: false,
					});
				}
			});

			// manually clear cache
			if (shouldClearCache(service.cache)) {
				await service.cache.clear();
			}

			await clearSystemCache();

			service = new FieldsService({
				schema: await getSchema(),
				accountability,
			});

			for (const field of fields) {
				const updatedField = await service.readOne(args.collection, field.field);
				result.push(updatedField);
			}

			return {
				type: 'text',
				data: result || null,
			};
		}

		if (args.action === 'delete') {
			const { collection, field } = args;
			await service.deleteField(collection, field);

			return {
				type: 'text',
				data: { collection, field },
			};
		}

		throw new InvalidPayloadError({ reason: 'Invalid action' });
	},
});
